import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { AppConfig, IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';
import { parseWorkdayTenantUrl, workdayEnv } from '../../../../helpers/ats/workday';

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
            const appConfig = account?.apps[0]?.app_config as AppConfig | undefined;
            const configured = appConfig?.org_url || config.WORKDAY_API_BASE_URL || '';
            let orgUrl = configured;
            if (orgUrl && config.WORKDAY_TENANT) {
                const parsed = new URL(orgUrl);
                if (!parsed.pathname || parsed.pathname === '/') {
                    orgUrl = parsed.origin + '/' + config.WORKDAY_TENANT;
                }
            }

            const endpoints = parseWorkdayTenantUrl(orgUrl, workdayEnv(config));
            if (!endpoints.tenant || !endpoints.tokenUrl) {
                return processOAuthResult({
                    status: false,
                    revertPublicKey,
                    tenantSecretToken,
                    response,
                    tenantId,
                    integrationName: mapIntegrationIdToIntegrationName[integrationId],
                    statusText: 'Workday tenant URL is not configured',
                    redirectUrl,
                });
            }

            const resolvedClientId = clientId || config.WORKDAY_CLIENT_ID;
            const resolvedClientSecret = clientSecret || config.WORKDAY_CLIENT_SECRET;
            const result = await axios({
                method: 'post',
                url: endpoints.tokenUrl,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: qs.stringify({
                    grant_type: 'authorization_code',
                    client_id: resolvedClientId,
                    client_secret: resolvedClientSecret,
                    code,
                    redirect_uri: config.OAUTH_REDIRECT_BASE + '/workday',
                }),
            });

            await xprisma.connections.upsert({
                where: { id: tenantId },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token,
                    tp_customer_id: 'Workday_user',
                    tp_account_url: endpoints.recruitingBase,
                    app_client_id: resolvedClientId,
                    app_client_secret: resolvedClientSecret,
                    app_config: { org_url: orgUrl },
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId,
                },
                update: {
                    tp_id: integrationId,
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token,
                    tp_customer_id: 'Workday_user',
                    tp_account_url: endpoints.recruitingBase,
                    app_client_id: resolvedClientId,
                    app_client_secret: resolvedClientSecret,
                    app_config: { org_url: orgUrl },
                    appId: account?.apps[0].id,
                },
            });

            await sendConnectionAddedEvent(
                svixAppId,
                tenantId,
                TP_ID.workday,
                result.data.access_token,
                'Workday_user',
            );

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: 'Workday_user',
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
