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
        request,
        redirectUrl,
    }: IntegrationAuthProps) {
        const effectiveClientId = clientId || config.WORKDAY_CLIENT_ID;
        const effectiveClientSecret = clientSecret || config.WORKDAY_CLIENT_SECRET;
        const appConfig = (account?.apps[0]?.app_config as AppConfig) || {};
        const subdomain =
            (request?.query?.subdomain as string) ||
            (request?.query?.domain as string) ||
            appConfig.org_url ||
            'wd2-impl-services1.workday.com';
        const workdayTenant = (request?.query?.workday_tenant as string) || 'default';
        const host = subdomain.startsWith('http') ? subdomain.replace(/\/+$/, '') : `https://${subdomain}`;
        const tokenUrl = `${host}/ccx/oauth2/${workdayTenant}/token`;

        const basicToken = Buffer.from(`${effectiveClientId}:${effectiveClientSecret}`).toString('base64');
        const formData = {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: `${config.OAUTH_REDIRECT_BASE}/workday`,
        };

        try {
            const result: any = await axios({
                method: 'post',
                url: tokenUrl,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${basicToken}`,
                },
                data: qs.stringify(formData),
            });

            logInfo('OAuth creds for Workday', result.data);

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
                    tp_account_url: `${host}/ccx/oauth2/${workdayTenant}`,
                    tp_customer_id: 'Workday_user',
                    app_client_id: effectiveClientId,
                    app_client_secret: effectiveClientSecret,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0]?.id,
                    environmentId: environmentId,
                },
                update: {
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token,
                    tp_account_url: `${host}/ccx/oauth2/${workdayTenant}`,
                    app_client_id: effectiveClientId,
                    app_client_secret: effectiveClientSecret,
                    tp_id: integrationId,
                    appId: account?.apps[0]?.id,
                    tp_customer_id: 'Workday_user',
                },
            });

            await sendConnectionAddedEvent(
                svixAppId,
                tenantId,
                TP_ID.workday,
                result.data.access_token,
                'Workday_user'
            );

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
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
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                redirectUrl,
            });
        }
    }
}

export default new WorkdayAuthHandler();
