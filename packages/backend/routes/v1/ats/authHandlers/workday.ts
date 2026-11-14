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
        // Workday uses OAuth 2.0 with authorization code flow
        // The tenant ID (workday tenant name) is passed as the account_url
        const workdayTenant = account?.apps[0]?.tp_id === 'workday'
            ? (account.apps[0] as any)?.tp_account_url || 'your-workday-tenant'
            : 'your-workday-tenant';

        const formData = {
            grant_type: 'authorization_code',
            client_id: clientId || config.WORKDAY_CLIENT_ID,
            client_secret: clientSecret || config.WORKDAY_CLIENT_SECRET,
            code: code,
            redirect_uri: `${config.OAUTH_REDIRECT_BASE}/workday`,
            scope: 'wd-ats',
        };

        try {
            const result: any = await axios({
                method: 'post',
                url: `https://wd2-impl.workdays.com/oauth2/${workdayTenant}/token`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: qs.stringify(formData),
            });

            logInfo('OAuth creds for Workday', result.data);

            // Workday returns access_token, refresh_token, and expires_in
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
                    tp_customer_id: 'workday_user',
                    tp_account_url: workdayTenant,
                    app_client_id: clientId || config.WORKDAY_CLIENT_ID,
                    app_client_secret: clientSecret || config.WORKDAY_CLIENT_SECRET,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0]?.id,
                    environmentId: environmentId,
                },
                update: {
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token,
                    app_client_id: clientId || config.WORKDAY_CLIENT_ID,
                    app_client_secret: clientSecret || config.WORKDAY_CLIENT_SECRET,
                    tp_id: integrationId,
                    appId: account?.apps[0]?.id,
                    tp_customer_id: 'workday_user',
                    tp_account_url: workdayTenant,
                },
            });

            await sendConnectionAddedEvent(
                svixAppId,
                tenantId,
                integrationId,
                result.data.access_token,
                'workday_user',
            );

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[TP_ID.workday],
                tpCustomerId: 'workday_user',
                redirectUrl,
            });
        } catch (error: any) {
            logInfo('Workday OAuth error', error.response?.data || error.message);
            return processOAuthResult({
                status: false,
                error,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[TP_ID.workday],
                redirectUrl,
            });
        }
    }
}

export default new WorkdayAuthHandler();
