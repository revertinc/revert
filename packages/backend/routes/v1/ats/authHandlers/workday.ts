import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { logInfo } from '../../../../helpers/logger';
import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
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
        const effectiveClientId = clientId || config.WORKDAY_CLIENT_ID;
        const effectiveClientSecret = clientSecret || config.WORKDAY_CLIENT_SECRET;
        const appConfig = (account?.apps[0]?.app_config as any) || {};
        const tokenUrl =
            appConfig.tokenUrl ||
            config.WORKDAY_TOKEN_URL ||
            'https://impl.workday.com/ccx/oauth2/token';

        try {
            const formData = {
                grant_type: 'authorization_code',
                client_id: effectiveClientId,
                client_secret: effectiveClientSecret,
                code: code,
                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/workday`,
            };

            const basicCredentials = Buffer.from(`${effectiveClientId}:${effectiveClientSecret}`).toString('base64');
            const result: any = await axios({
                method: 'post',
                url: tokenUrl,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${basicCredentials}`,
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
                    tp_refresh_token: result.data.refresh_token ?? null,
                    tp_customer_id: 'Workday_user',
                    app_client_id: effectiveClientId,
                    app_client_secret: effectiveClientSecret,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0]?.id,
                    environmentId: environmentId,
                },
                update: {
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token ?? null,
                    app_client_id: effectiveClientId,
                    app_client_secret: effectiveClientSecret,
                    tp_id: integrationId,
                    appId: account?.apps[0]?.id,
                    tp_customer_id: 'Workday_user',
                },
            });

            sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workday, result.data.access_token, 'Workday_user');

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
