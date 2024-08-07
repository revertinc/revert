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

class ClickUpAuthHandler extends BaseOAuthHandler {
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
        const formData = {
            client_id: clientId || config.CLICKUP_CLIENT_ID,
            client_secret: clientSecret || config.CLICKUP_CLIENT_SECRET,
            code,
        };
        logInfo('client credentials ', formData);
        const result = await axios({
            method: 'post',
            url: 'https://api.clickup.com/api/v2/oauth/token',
            data: qs.stringify(formData),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        logInfo('OAuth creds for Clickup', result.data);

        const info = await axios({
            method: 'get',
            url: 'https://api.clickup.com/api/v2/user',
            headers: {
                Authorization: `${result.data?.token_type} ${result.data.access_token}`,
            },
        });
        logInfo('OAuth token info', info.data);

        try {
            await xprisma.connections.upsert({
                where: {
                    id: tenantId,
                },
                update: {
                    tp_access_token: result.data?.access_token,
                    tp_refresh_token: null,
                    app_client_id: clientId || config.CLICKUP_CLIENT_ID,
                    app_client_secret: clientSecret || config.CLICKUP_CLIENT_SECRET,
                    tp_id: integrationId,
                    appId: account?.apps[0].id,
                    tp_customer_id: String(info.data?.user?.id),
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: String(result.data?.access_token),
                    app_client_id: clientId || config.CLICKUP_CLIENT_ID,
                    app_client_secret: clientSecret || config.CLICKUP_CLIENT_SECRET,
                    tp_customer_id: String(info.data?.user?.id),
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId: environmentId,
                },
            });

            await sendConnectionAddedEvent(
                svixAppId,
                tenantId,
                TP_ID.clickup,
                result.data.access_token,
                info.data?.user?.id,
            );

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: info.data?.user?.id,
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

export default new ClickUpAuthHandler();
