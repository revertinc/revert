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
        redirectUrl,
    }: IntegrationAuthProps) {
        const appConfig = account?.apps?.[0]?.app_config as AppConfig | undefined;
        const orgUrl = ((appConfig as any)?.org_url || config.WORKDAY_ORG_URL || '').replace(/\/+$/, '');

        const formData = {
            grant_type: 'authorization_code',
            client_id: clientId || config.WORKDAY_CLIENT_ID,
            client_secret: clientSecret || config.WORKDAY_CLIENT_SECRET,
            code: code,
            redirect_uri: `${config.OAUTH_REDIRECT_BASE}/workday`,
        };

        const url = `${orgUrl}/ccx/oauth2/token`;

        const result: any = await axios({
            method: 'post',
            url: url,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: qs.stringify(formData),
        });

        logInfo('OAuth creds for Workday', result.data);

        try {
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
                    tp_account_url: orgUrl,
                    tp_customer_id: 'Workday_user',
                    app_client_id: clientId || config.WORKDAY_CLIENT_ID,
                    app_client_secret: clientSecret || config.WORKDAY_CLIENT_SECRET,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps?.[0]?.id,
                    environmentId: environmentId,
                },
                update: {
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token,
                    tp_account_url: orgUrl,
                    app_client_id: clientId || config.WORKDAY_CLIENT_ID,
                    app_client_secret: clientSecret || config.WORKDAY_CLIENT_SECRET,
                    tp_id: integrationId,
                    appId: account?.apps?.[0]?.id,
                    tp_customer_id: 'Workday_user',
                },
            });

            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workday, result.data.access_token, 'Workday_user');

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
