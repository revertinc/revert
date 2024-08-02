import { REVERT_BASE_API_URL } from '@revertdotdev/lib/constants';
import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import useSWR from 'swr';

const fetcher = (url: string) => {
    const privateToken = localStorage.getItem('privateToken') as string;
    return fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-revert-api-token': privateToken },
    })
        .then((res) => res.json())
        .then((data) => {
            const { error, status } = data;
            if (data.error) {
                const errorMessage =
                    error?.code === 'P2002'
                        ? ': Already connected another app. Please disconnect first.'
                        : `${error.message}`;
                throw {
                    message: errorMessage,
                    status: status,
                    data: `errorData ${errorMessage}`,
                };
            }
            return data;
        })
        .catch((err) => {
            throw {
                message: err,
                status: err.status,
                data: `Error out`,
            };
        });
};

export function useConnection(integrationId: string) {
    const searchParams = useSearchParams() as ReadonlyURLSearchParams;
    const {
        code,
        state,
        location,
        'accounts-server': accountUrl,
        oauth_token: OAuthToken,
        oauth_verifier: OAuthVerifier,
    } = Object.fromEntries(searchParams.entries());
    const { tenantId, revertPublicToken, redirectUrl } = JSON.parse(state);

    let url!: URL;

    const params = new URLSearchParams();
    params.set('integrationId', integrationId);
    params.set('code', code);
    params.set('t_id', tenantId);
    params.set('x_revert_public_token', revertPublicToken);
    params.set('redirect_url', redirectUrl !== undefined && redirectUrl !== null ? redirectUrl : '');

    switch (integrationId) {
        case 'zohocrm': {
            params.set('location', location);
            params.set('accountURL', accountUrl);
        }
        case 'pipedrive':
        case 'closecrm':
        case 'sfdc':
        case 'ms_dynamics_365_sales':
        case 'hubspot': {
            url = new URL(`${REVERT_BASE_API_URL}/v1/crm/oauth-callback?${params.toString()}`);
            break;
        }

        case 'bitbucket':
        case 'jira':
        case 'clickup': {
            url = new URL(`${REVERT_BASE_API_URL}/v1/ticket/oauth-callback?${params.toString()}`);
            break;
        }

        case 'linear':
        case 'discord':
        case 'slack': {
            url = new URL(`${REVERT_BASE_API_URL}/v1/chat/oauth-callback?${params.toString()}`);
            break;
        }

        case 'trello': {
            params.set('oauth_token', OAuthToken);
            params.set('oauth_verifier', OAuthVerifier);
            url = new URL(`${REVERT_BASE_API_URL}/v1/ticket/oauth-callback?${params.toString()}`);
            break;
        }
    }
    const { data, error, isLoading } = useSWR(url.toString(), fetcher, { shouldRetryOnError: false });

    return {
        data,
        error,
        isLoading,
    };
}
