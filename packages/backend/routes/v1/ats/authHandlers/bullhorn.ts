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

class BullhornAuthHandler extends BaseOAuthHandler {
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
            let accessToken = code;
            let refreshToken: string | undefined = undefined;
            let bhRestToken = code;
            let restUrl = 'https://rest.bullhornstaffing.com/rest-services/';

            if (code && !code.startsWith('{')) {
                const formData = {
                    grant_type: 'authorization_code',
                    client_id: clientId || config.BULLHORN_CLIENT_ID,
                    client_secret: clientSecret || config.BULLHORN_CLIENT_SECRET,
                    code: code,
                    redirect_uri: `${config.OAUTH_REDIRECT_BASE}/bullhorn`,
                };

                const tokenRes: any = await axios({
                    method: 'post',
                    url: 'https://auth.bullhornstaffing.com/oauth/token',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    data: qs.stringify(formData),
                });

                accessToken = tokenRes.data.access_token;
                refreshToken = tokenRes.data.refresh_token;

                const loginRes: any = await axios({
                    method: 'get',
                    url: `https://rest.bullhornstaffing.com/rest-services/login?version=*&access_token=${accessToken}`,
                });

                bhRestToken = loginRes.data.BhRestToken;
                restUrl = loginRes.data.restUrl;
            } else if (code && code.startsWith('{')) {
                try {
                    const parsed = JSON.parse(code);
                    bhRestToken = parsed.BhRestToken || parsed.access_token || code;
                    restUrl = parsed.restUrl || restUrl;
                } catch {
                    // keep raw code
                }
            }

            const tokenPayload = JSON.stringify({
                BhRestToken: bhRestToken,
                restUrl: restUrl,
                access_token: accessToken,
                refresh_token: refreshToken,
            });

            logInfo('OAuth creds for Bullhorn', { bhRestToken, restUrl });

            await xprisma.connections.upsert({
                where: {
                    id: tenantId,
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: tokenPayload,
                    tp_refresh_token: refreshToken,
                    tp_customer_id: 'Bullhorn_user',
                    app_client_id: clientId || config.BULLHORN_CLIENT_ID,
                    app_client_secret: clientSecret || config.BULLHORN_CLIENT_SECRET,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0]?.id,
                    environmentId: environmentId,
                },
                update: {
                    tp_access_token: tokenPayload,
                    tp_refresh_token: refreshToken,
                    app_client_id: clientId || config.BULLHORN_CLIENT_ID,
                    app_client_secret: clientSecret || config.BULLHORN_CLIENT_SECRET,
                    tp_id: integrationId,
                    appId: account?.apps[0]?.id,
                    tp_customer_id: 'Bullhorn_user',
                },
            });

            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.bullhorn, bhRestToken, 'Bullhorn_user');

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: 'Bullhorn_user',
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

export default new BullhornAuthHandler();
