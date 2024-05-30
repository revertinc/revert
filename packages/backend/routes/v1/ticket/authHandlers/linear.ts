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

class LinearAuthHandler extends BaseOAuthHandler {
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
        // Handle the received code
        const url = `https://api.linear.app/oauth/token`;
        const formData = {
            grant_type: 'authorization_code',
            client_id: clientId || config.LINEAR_CLIENT_ID,
            client_secret: clientSecret || config.LINEAR_CLIENT_SECRET,
            redirect_uri: `${config.OAUTH_REDIRECT_BASE}/linear`,
            code,
        };

        const result = await axios({
            method: 'post',
            url: url,
            data: qs.stringify(formData),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        logInfo('OAuth creds for Linear', result.data);
        const query = `query Me {
          viewer {
            id
            name
            email
          }
        }`;

        const info = await axios({
            method: 'post',
            url: 'https://api.linear.app/graphql',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${result.data.token_type} ${result.data.access_token}`,
            },
            data: JSON.stringify({ query: query }),
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
                    app_client_id: clientId || config.LINEAR_CLIENT_ID,
                    app_client_secret: clientSecret || config.LINEAR_CLIENT_SECRET,
                    tp_id: integrationId,
                    appId: account?.apps[0].id,
                    tp_customer_id: String(info.data.viewer?.id),
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: String(result.data?.access_token),
                    app_client_id: clientId || config.LINEAR_CLIENT_ID,
                    app_client_secret: clientSecret || config.LINEAR_CLIENT_SECRET,
                    tp_customer_id: String(info.data.viewer?.id),
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId: environmentId,
                },
            });

            // svix stuff here
            sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.linear, result.data.access_token, info.data.viewer?.id);

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: info.data.viewer?.id,
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

export default new LinearAuthHandler();
