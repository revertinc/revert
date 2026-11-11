import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';
import { buildWorkdayRestUrl, buildWorkdayTokenEndpoint } from '../../../../helpers/ats/workday';

export class WorkdayAuthHandler extends BaseOAuthHandler {
    getTokenUrl(host: string, tenant: string): string {
        return buildWorkdayTokenEndpoint(host, tenant);
    }

    getServiceUrl(host: string, tenant: string, service = 'recruiting/v1'): string {
        return buildWorkdayRestUrl(host, tenant, service);
    }

    buildRefreshTokenPayload(params: {
        clientId: string;
        clientSecret: string;
        refreshToken: string;
    }): string {
        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: params.clientId,
            client_secret: params.clientSecret,
            refresh_token: params.refreshToken,
        });
        return body.toString();
    }
}

export default new WorkdayAuthHandler();
