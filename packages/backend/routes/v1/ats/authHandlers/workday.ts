import axios from 'axios';
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
        try {
            const effectiveClientId = clientId || config.WORKDAY_CLIENT_ID;
            const effectiveClientSecret = clientSecret || config.WORKDAY_CLIENT_SECRET;
            let accessToken = code;
            let refreshToken: string | null = null;

            // If OAuth credentials are configured, exchange authorization code for access token
            if (effectiveClientId && effectiveClientSecret) {
                const appConfig = account?.apps[0]?.app_config as AppConfig;
                const orgSubdomain = appConfig?.org_url || 'wd2-impl-services1.workday.com';
                const tenant = (appConfig as any)?.tenant || 'default';
                const host = orgSubdomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
                const tokenUrl = `https://${host}/ccx/oauth2/${tenant}/token`;

                try {
                    const params = new URLSearchParams();
                    params.append('client_id', effectiveClientId);
                    params.append('client_secret', effectiveClientSecret);
                    params.append('code', code);
                    params.append('grant_type', 'authorization_code');
                    params.append('redirect_uri', `${config.OAUTH_REDIRECT_BASE}/workday`);

                    const result: any = await axios({
                        method: 'post',
                        url: tokenUrl,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            Accept: 'application/json',
                        },
                        data: params.toString(),
                    });

                    logInfo('OAuth creds for Workday', result.data);
                    if (result.data?.access_token) {
                        accessToken = result.data.access_token;
                        refreshToken = result.data.refresh_token || null;
                    }
                } catch (oauthErr) {
                    logInfo('Workday OAuth code exchange skipped or failed, using code directly as API token', oauthErr);
                }
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
                    tp_customer_id: 'Workday user',
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
                    tp_customer_id: 'Workday user',
                },
            });

            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workday, accessToken, 'Workday user');

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: 'Workday user',
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

    async handleBasicAuth(props: IntegrationAuthProps) {
        return this.handleOAuth(props);
    }
}

export default new WorkdayAuthHandler();
