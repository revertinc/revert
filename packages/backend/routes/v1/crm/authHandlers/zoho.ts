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
class ZohoAuthHandler extends BaseOAuthHandler {
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
    }: IntegrationAuthProps) {
        try {
            const url = `${request?.query.accountURL}/oauth/v2/token`;
            const formData = {
                grant_type: 'authorization_code',
                client_id: clientId || config.ZOHOCRM_CLIENT_ID,
                client_secret: clientSecret || config.ZOHOCRM_CLIENT_SECRET,
                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/zohocrm`,
                code,
            };

            logInfo('Zoho', request?.query, formData);

            const result = await axios({
                method: 'post',
                url: url,
                data: qs.stringify(formData),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                },
            });

            logInfo('OAuth creds for zohocrm', result.data);
            if (result.data.error) {
                return processOAuthResult({
                    status: false,
                    error: result.data.error,
                    revertPublicKey,
                    tenantSecretToken,
                    response,
                    tenantId: tenantId,
                    integrationName: mapIntegrationIdToIntegrationName[integrationId],
                });
            } else {
                const info = await axios({
                    method: 'get',
                    url: 'https://accounts.zoho.com/oauth/user/info',
                    headers: {
                        authorization: `Zoho-oauthtoken ${result.data.access_token}`,
                    },
                });
                logInfo('Oauth token info', info.data);

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
                        tp_customer_id: info.data.Email,
                        tp_account_url: request?.query.accountURL as string,
                        app_client_id: clientId || config.ZOHOCRM_CLIENT_ID,
                        app_client_secret: clientSecret || config.ZOHOCRM_CLIENT_SECRET,
                        owner_account_public_token: revertPublicKey,
                        appId: account?.apps[0].id,
                        environmentId: environmentId,
                    },
                    update: {
                        tp_access_token: result.data.access_token,
                        tp_refresh_token: result.data.refresh_token,
                        app_client_id: clientId || config.ZOHOCRM_CLIENT_ID,
                        app_client_secret: clientSecret || config.ZOHOCRM_CLIENT_SECRET,
                        tp_id: integrationId,
                        appId: account?.apps[0].id,
                        tp_customer_id: info.data.Email,
                        tp_account_url: request.query.accountURL as string,
                    },
                });
                await sendConnectionAddedEvent(
                    svixAppId,
                    tenantId,
                    TP_ID.zohocrm,
                    result.data.access_token,
                    info.data.Email
                );

                return processOAuthResult({
                    status: true,
                    revertPublicKey,
                    tenantSecretToken,
                    response,
                    tenantId: tenantId,
                    integrationName: mapIntegrationIdToIntegrationName[integrationId],
                    tpCustomerId: info.data.Email,
                });
            }
        } catch (error: any) {
            console.log('OAuthERROR', error);
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

export default new ZohoAuthHandler();
