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
import { applyWorkdayTenantFallback, parseWorkdayOrgUrl } from '../../../../helpers/ats/workday';

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
            const orgUrl = applyWorkdayTenantFallback(
                (account?.apps[0]?.app_config as AppConfig)?.org_url || config.WORKDAY_API_BASE_URL || '',
                config.WORKDAY_TENANT,
            );
            const tenantUrls = parseWorkdayOrgUrl(orgUrl, {
                tokenUrl: config.WORKDAY_TOKEN_URL,
                authUrl: config.WORKDAY_AUTH_URL,
            });
            const tokenUrl = tenantUrls.tokenUrl || config.WORKDAY_TOKEN_URL;

            if (!tokenUrl) {
                return processOAuthResult({
                    status: false,
                    revertPublicKey,
                    tenantSecretToken,
                    response,
                    tenantId,
                    integrationName: mapIntegrationIdToIntegrationName[integrationId],
                    statusText:
                        'Workday token URL is not configured. Set app_config.org_url (tenant REST base) or WORKDAY_TOKEN_URL.',
                    redirectUrl,
                });
            }

            const formData = {
                grant_type: 'authorization_code',
                client_id: clientId || config.WORKDAY_CLIENT_ID,
                client_secret: clientSecret || config.WORKDAY_CLIENT_SECRET,
                code,
                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/workday`,
            };

            const result: any = await axios({
                method: 'post',
                url: tokenUrl,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: qs.stringify(formData),
            });

            logInfo('OAuth creds for Workday', result.data);

            const recruitingBase = tenantUrls.recruitingBase || orgUrl;

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
                    tp_customer_id: 'Workday_user',
                    tp_account_url: recruitingBase || null,
                    app_client_id: clientId || config.WORKDAY_CLIENT_ID,
                    app_client_secret: clientSecret || config.WORKDAY_CLIENT_SECRET,
                    app_config: { org_url: orgUrl || recruitingBase },
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId: environmentId,
                },
                update: {
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token,
                    app_client_id: clientId || config.WORKDAY_CLIENT_ID,
                    app_client_secret: clientSecret || config.WORKDAY_CLIENT_SECRET,
                    tp_id: integrationId,
                    appId: account?.apps[0].id,
                    tp_customer_id: 'Workday_user',
                    tp_account_url: recruitingBase || null,
                    app_config: { org_url: orgUrl || recruitingBase },
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
