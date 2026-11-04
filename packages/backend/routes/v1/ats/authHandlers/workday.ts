import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { logInfo } from '../../../../helpers/logger';
import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { AppConfig, IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';

export interface WorkdayEndpoints {
    hostUrl: string;
    tenant: string;
    tokenUrl: string;
    authorizeUrl: string;
    apiBaseUrl: string;
}

export const parseWorkdayOrgUrl = (rawOrgUrl?: string | null): WorkdayEndpoints => {
    const fallback = (rawOrgUrl || config.WORKDAY_ORG_URL || 'https://wd2-impl-services1.workday.com/ccx/api/v1/tenant')
        .trim()
        .replace(/\/+$/, '');
    const withProtocol = /^https?:\/\//i.test(fallback) ? fallback : `https://${fallback}`;
    const parsed = new URL(withProtocol);
    const hostUrl = `${parsed.protocol}//${parsed.host}`;
    const segments = parsed.pathname.split('/').filter(Boolean);
    const tenant = segments[segments.length - 1] || 'tenant';

    return {
        hostUrl,
        tenant,
        tokenUrl: `${hostUrl}/ccx/oauth2/${tenant}/token`,
        authorizeUrl: `${hostUrl}/${tenant}/authorize`,
        apiBaseUrl: `${hostUrl}/ccx/api/v1/${tenant}`,
    };
};

class WorkdayAuthHandler extends BaseOAuthHandler {
    async handleOAuth({
        account,
        clientId,
        clientSecret,
        code,
        integrationId,
        revertPublicKey,
        svixAppId,
        environmentId,
        tenantId,
        tenantSecretToken,
        response,
        redirectUrl,
    }: IntegrationAuthProps) {
        try {
            const configuredOrgUrl = account?.apps[0]?.is_revert_app
                ? config.WORKDAY_ORG_URL
                : (account?.apps[0]?.app_config as AppConfig)?.org_url || config.WORKDAY_ORG_URL;
            const endpoints = parseWorkdayOrgUrl(configuredOrgUrl);
            const resolvedClientId = clientId || config.WORKDAY_CLIENT_ID;
            const resolvedClientSecret = clientSecret || config.WORKDAY_CLIENT_SECRET;
            const basicCredentials = Buffer.from(`${resolvedClientId}:${resolvedClientSecret}`).toString('base64');

            const formData = {
                grant_type: 'authorization_code',
                code,
                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/workday`,
            };

            const result: any = await axios({
                method: 'post',
                url: endpoints.tokenUrl,
                headers: {
                    Authorization: `Basic ${basicCredentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json',
                },
                data: qs.stringify(formData),
            });

            logInfo('OAuth creds for Workday', result.data);

            const accessToken = result.data.access_token;
            const refreshToken = result.data.refresh_token || null;
            const customerId = `Workday_${endpoints.tenant}`;

            await xprisma.connections.upsert({
                where: {
                    id: tenantId,
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: accessToken,
                    tp_refresh_token: refreshToken,
                    tp_customer_id: customerId,
                    tp_account_url: endpoints.apiBaseUrl,
                    app_client_id: resolvedClientId,
                    app_client_secret: resolvedClientSecret,
                    app_config: { org_url: endpoints.apiBaseUrl },
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0]?.id,
                    environmentId,
                },
                update: {
                    tp_access_token: accessToken,
                    tp_refresh_token: refreshToken,
                    tp_customer_id: customerId,
                    tp_account_url: endpoints.apiBaseUrl,
                    app_client_id: resolvedClientId,
                    app_client_secret: resolvedClientSecret,
                    app_config: { org_url: endpoints.apiBaseUrl },
                    tp_id: integrationId,
                    appId: account?.apps[0]?.id,
                },
            });

            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workday, accessToken, customerId);

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: customerId,
                redirectUrl,
            });
        } catch (error: any) {
            return processOAuthResult({
                status: false,
                error,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                redirectUrl,
            });
        }
    }
}

export default new WorkdayAuthHandler();
