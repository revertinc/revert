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

class WorkableAuthHandler extends BaseOAuthHandler {
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
        const effectiveClientId = clientId || config.WORKABLE_CLIENT_ID;
        const effectiveClientSecret = clientSecret || config.WORKABLE_CLIENT_SECRET;

        try {
            let accessToken = code;
            let refreshToken: string | null = null;

            if (effectiveClientId && effectiveClientSecret) {
                const formData = {
                    grant_type: 'authorization_code',
                    client_id: effectiveClientId,
                    client_secret: effectiveClientSecret,
                    code: code,
                    redirect_uri: `${config.OAUTH_REDIRECT_BASE}/workable`,
                };

                const result: any = await axios({
                    method: 'post',
                    url: 'https://www.workable.com/oauth/token',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    data: qs.stringify(formData),
                });

                logInfo('OAuth creds for Workable', result.data);
                accessToken = result.data.access_token;
                refreshToken = result.data.refresh_token ?? null;
            }

            await xprisma.connections.upsert({
                where: {
                    id: tenantId,
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: accessToken,
                    tp_refresh_token: refreshToken,
                    tp_customer_id: 'Workable_user',
                    app_client_id: effectiveClientId || null,
                    app_client_secret: effectiveClientSecret || null,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0]?.id,
                    environmentId: environmentId,
                },
                update: {
                    tp_access_token: accessToken,
                    tp_refresh_token: refreshToken,
                    app_client_id: effectiveClientId || null,
                    app_client_secret: effectiveClientSecret || null,
                    tp_id: integrationId,
                    appId: account?.apps[0]?.id,
                    tp_customer_id: 'Workable_user',
                },
            });

            sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workable, accessToken, 'Workable_user');

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: 'Workable_user',
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

export default new WorkableAuthHandler();
