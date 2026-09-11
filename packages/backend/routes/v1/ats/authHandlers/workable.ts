import axios from 'axios';
import config from '../../../../config';
import { logInfo, logError } from '../../../../helpers/logger';
import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';

export class WorkableAuthHandler extends BaseOAuthHandler {
    /**
     * Handles direct API Access Token authentication for Workable (Settings > Integrations > Access Token).
     * The token is passed as `code` in the basic auth connection flow.
     */
    async handleBasicAuth({
        account,
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
            await xprisma.connections.upsert({
                where: {
                    id: tenantId,
                },
                update: {
                    tp_access_token: code,
                    tp_refresh_token: null,
                    app_client_id: null,
                    app_client_secret: null,
                    tp_id: integrationId,
                    appId: account?.apps[0]?.id,
                    tp_customer_id: 'Workable user',
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: code,
                    app_client_id: null,
                    app_client_secret: null,
                    tp_customer_id: 'Workable user',
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0]?.id,
                    environmentId: environmentId,
                },
            });

            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workable, code, 'Workable user');

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: 'Workable user',
                redirectUrl,
            });
        } catch (error: any) {
            logError('Workable handleBasicAuth error', error);
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

    /**
     * Handles standard OAuth2 code exchange flow for Workable.
     */
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
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: `${config.OAUTH_REDIRECT_BASE}/workable`,
        };

        try {
            const tokenUrl = config.WORKABLE_TOKEN_URL || 'https://oauth.workable.com/oauth/token';
            const result: any = await axios({
                method: 'post',
                url: tokenUrl,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: new URLSearchParams(formData as any).toString(),
            });

            logInfo('OAuth creds for Workable', result.data);

            await xprisma.connections.upsert({
                where: {
                    id: tenantId,
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token || null,
                    app_client_id: clientId,
                    app_client_secret: clientSecret,
                    tp_customer_id: 'Workable user',
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0]?.id,
                    environmentId: environmentId,
                },
                update: {
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token || null,
                    app_client_id: clientId,
                    app_client_secret: clientSecret,
                    tp_id: integrationId,
                    appId: account?.apps[0]?.id,
                    tp_customer_id: 'Workable user',
                },
            });

            await sendConnectionAddedEvent(
                svixAppId,
                tenantId,
                TP_ID.workable,
                result.data.access_token,
                'Workable user',
            );

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: 'Workable user',
                redirectUrl,
            });
        } catch (error: any) {
            logError('Workable handleOAuth error', error?.response?.data || error);
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
