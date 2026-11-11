import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';
import { buildWorkableBaseUrl } from '../../../../helpers/ats/workable';

export class WorkableAuthHandler extends BaseOAuthHandler {
    getAuthorizationUrl(params: {
        clientId: string;
        redirectUri: string;
        state: string;
        scope?: string;
    }): string {
        const scope = params.scope || 'r_jobs r_candidates w_candidates';
        const q = new URLSearchParams({
            client_id: params.clientId,
            redirect_uri: params.redirectUri,
            response_type: 'code',
            resource: 'user',
            scope,
            state: params.state,
        });
        return `https://www.workable.com/oauth/authorize?${q.toString()}`;
    }

    buildHeaders(accessToken: string): Record<string, string> {
        return {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        };
    }

    resolveEndpoint(subdomain: string, path: string): string {
        const base = buildWorkableBaseUrl(subdomain);
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${base}${cleanPath}`;
    }
}

export default new WorkableAuthHandler();
