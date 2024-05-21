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

class SlackAuthHandler extends BaseOAuthHandler {
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
    }: IntegrationAuthProps) {
        const url = 'https://slack.com/api/oauth.v2.access';
        const formData = {
            grant_type: 'authorization_code',
            client_id: clientId || config.SLACK_CLIENT_ID,
            client_secret: clientSecret || config.SLACK_CLIENT_SECRET,
            redirect_uri: `${config.OAUTH_REDIRECT_BASE}/slack`,
            code,
        };

        const result = await axios({
            method: 'post',
            url: url,
            data: qs.stringify(formData),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        logInfo('OAuth creds for slack', result.data);

        const info = await axios({
            method: 'get',
            url: 'https://slack.com/api/users.info',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Bearer ${result.data.access_token}`,
            },
            params: {
                user: result.data.authed_user.id,
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
                    tp_refresh_token: result.data?.refresh_token,
                    app_client_id: clientId || config.SLACK_CLIENT_ID,
                    app_client_secret: clientSecret || config.SLACK_CLIENT_SECRET,
                    tp_id: integrationId,
                    appId: account?.apps[0].id,
                    tp_customer_id: String(info.data.user?.id),
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: String(result.data?.access_token),
                    tp_refresh_token: String(result.data?.refresh_token),
                    app_client_id: clientId || config.SLACK_CLIENT_ID,
                    app_client_secret: clientSecret || config.SLACK_CLIENT_SECRET,
                    tp_customer_id: String(info.data.user?.id),
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId: environmentId,
                },
            });
            // Svix stuff goes here ****
            await sendConnectionAddedEvent(
                svixAppId,
                tenantId,
                TP_ID.slack,
                String(result.data?.access_token),
                String(info.data.user?.id)
            );

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: info.data.user,
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
            });
        }
    }
}

export default new SlackAuthHandler();
