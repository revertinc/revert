import config from '../../../../config';
import { logInfo } from '../../../../helpers/logger';
import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import { OAuth } from 'oauth';
import redis from '../../../../redis/client';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';
class TrelloAuthHandler extends BaseOAuthHandler {
    async handleOAuth({
        account,
        clientId,
        clientSecret,
        integrationId,
        revertPublicKey,
        svixAppId,
        environmentId,
        tenantId,
        tenantSecretToken,
        response,
        request,
        redirectUrl
    }: IntegrationAuthProps) {
        const trelloClientId = clientId ? clientId : config.TRELLO_CLIENT_ID;
        const trelloClientSecret = clientId ? clientId : config.TRELLO_CLIENT_SECRET;
        const requestURL = 'https://trello.com/1/OAuthGetRequestToken';
        const accessURL = 'https://trello.com/1/OAuthGetAccessToken';
        const oauth = new OAuth(
            requestURL,
            accessURL,
            String(trelloClientId),
            String(trelloClientSecret),
            '1.0A',
            null,
            'HMAC-SHA1'
        );
        const token = String(request.query.oauth_token);
        const verifier = String(request.query.oauth_verifier);
        const tokenSecret = await redis.get(`trello_dev_oauth_token_${request.query.oauth_token}`);
        try {
            const { accessToken, accessTokenSecret }: { accessToken: string; accessTokenSecret: string } =
                await new Promise((resolve, reject) => {
                    oauth.getOAuthAccessToken(
                        token,
                        String(tokenSecret),
                        verifier,
                        (error, accessToken, accessTokenSecret, _results) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve({ accessToken, accessTokenSecret });
                            }
                        }
                    );
                });
            await redis.setEx(`trello_dev_access_token_secret_${accessToken}`, 3600 * 24 * 10, accessTokenSecret);
            const access_creds: { access_token: string; access_secret: string } = {
                access_token: accessToken,
                access_secret: accessTokenSecret,
            };
            logInfo('OAuth creds for Trello', access_creds);
            let info: any = await new Promise((resolve, reject) => {
                oauth.getProtectedResource(
                    'https://api.trello.com/1/members/me',
                    'GET',
                    accessToken,
                    accessTokenSecret,
                    (error, data, _response) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(data);
                        }
                        logInfo('OAuth token info', data);
                    }
                );
            });
            info = JSON.parse(info);

            await xprisma.connections.upsert({
                where: {
                    id: tenantId,
                },
                update: {
                    tp_access_token: String(access_creds.access_token),
                    tp_refresh_token: null,
                    app_client_id: clientId || config.TRELLO_CLIENT_ID,
                    app_client_secret: clientSecret || config.TRELLO_CLIENT_SECRET,
                    tp_id: integrationId,
                    appId: account?.apps[0].id,
                    tp_customer_id: String(info.id),
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: String(access_creds.access_token),
                    app_client_id: clientId || config.TRELLO_CLIENT_ID,
                    app_client_secret: clientSecret || config.TRELLO_CLIENT_SECRET,
                    tp_customer_id: String(info.id),
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId: environmentId,
                },
            });

            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.trello, access_creds.access_token, info.id);

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: info.id,
                redirectUrl
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
                redirectUrl
            });
        }
    }
}

export default new TrelloAuthHandler();
