import { REVERT_BASE_API_URL } from '@revertdotdev/lib/constants';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';

const fetcher = (url: string) =>
    fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    }).then((res) => res.json());

export function useConnection(integrationId: string) {
    const searchParams = useSearchParams();
    const { code, state } = Object.fromEntries(searchParams.entries());
    const { tenantId, revertPublicToken, redirectUrl } = JSON.parse(state);

    // Todo: Add Integrations and make this url to use URL object 
    let url: string = '';

    switch (integrationId) {
        case 'clickup': {
            url = `${REVERT_BASE_API_URL}/v1/ticket/oauth-callback?integrationId=${integrationId}&code=${code}&t_id=${tenantId}&x_revert_public_token=${revertPublicToken}${
                redirectUrl ? `&redirect_url=${redirectUrl}` : ``
            }`;
            break;
        }
        case 'pipedrive':
        case 'hubspot': {
            url = `${REVERT_BASE_API_URL}/v1/crm/oauth-callback?integrationId=${integrationId}&code=${code}&t_id=${tenantId}&x_revert_public_token=${revertPublicToken}${
                redirectUrl ? `&redirect_url=${redirectUrl}` : ``
            }`;
            break;
        }
    }
    const { data, error, isLoading } = useSWR(url, fetcher, { shouldRetryOnError: false });

    return {
        data,
        error,
        isLoading,
    };
}
