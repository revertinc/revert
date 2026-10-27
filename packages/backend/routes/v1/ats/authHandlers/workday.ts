import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { logInfo } from '../../../../helpers/logger';
import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName, AppConfig } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';
import { getWorkdayOAuthUrls, parseWorkdayTenantUrl, WorkdayConfigError } from '../../../../helpers/ats/workday';

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
            const appConfig = account?.apps[0]?.app_config as AppConfig & { tenantUrl?: string };
            const tenant = parseWorkdayTenantUrl(appConfig?.tenantUrl);
            const { tokenUrl } = getWorkdayOAuthUrls(tenant);

            const resolvedClientId = clientId || config.WORKDAY_CLIENT_ID;
            const resolvedClientSecret = clientSecret || config.WORKDAY_CLIENT_SECRET;

            const basicToken = Buffer.from(`${resolvedClientId}:${resolvedClientSecret}`).toString('base64');
            const formData = {
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/workday`,
            };

            const result: any = await axios({
                method: 'post',
                url: tokenUrl,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${basicToken}`,
                },
                data: qs.stringify(formData),
            });

            logInfo('OAuth creds for Workday', { tenant: tenant.tenant, status: result.status });

            await xprisma.connections.upsert({
                where: {
                    id: tenantId,
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token,
                    tp_customer_id: tenant.tenant,
                    app_client_id: resolvedClientId,
                    app_client_secret: resolvedClientSecret,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId: environmentId,
                },
                update: {
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token,
                    app_client_id: resolvedClientId,
                    app_client_secret: resolvedClientSecret,
                    tp_id: integrationId,
                    appId: account?.apps[0].id,
                    tp_customer_id: tenant.tenant,
                },
            });

            await sendConnectionAddedEvent(
                svixAppId,
                tenantId,
                TP_ID.workday,
                result.data.access_token,
                tenant.tenant,
            );

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: tenant.tenant,
                redirectUrl,
            });
        } catch (error: any) {
            const statusText =
                error instanceof WorkdayConfigError
                    ? `Invalid Workday tenant URL: ${error.message}`
                    : 'Error while getting oauth creds';
            return processOAuthResult({
                status: false,
                error,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                statusText,
                redirectUrl,
            });
        }
    }
}

export default new WorkdayAuthHandler();
