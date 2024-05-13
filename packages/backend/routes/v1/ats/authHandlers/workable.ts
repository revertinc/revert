import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { logInfo } from '../../../../helpers/logger';
import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { AppConfig, IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
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
    }: IntegrationAuthProps) {
        let orgURL = account?.apps[0]?.is_revert_app ? undefined : (account?.apps[0]?.app_config as AppConfig)?.org_url;
        if (!orgURL) orgURL = config.WORKABLE_ORG_URL;

        const formData = {
            grant_type: 'authorization_code',
            client_id: clientId || config.WORKABLE_CLIENT_ID,
            client_secret: clientSecret || config.WORKABLE_CLIENT_SECRET,
            code: code,
            redirect_uri: `${config.OAUTH_REDIRECT_BASE}/workable`,
        };

        const result = await axios({
            method: 'post',
            url: 'https://www.workable.com/oauth/token',
            headers: {
                'Content-Type': 'application/json',
            },
            data: qs.stringify(formData),
        });

        logInfo('OAuth token from Workable', result.data);

        const auth = 'Bearer ' + result.data?.access_token;

        const info = await axios({
            method: 'GET',
            url: `https://www.workable.com/spi/v3/accounts`,
            headers: {
                Authorization: auth,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
        logInfo('User info', info.data);

        try {
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
                    tp_customer_id: info.data?.id,
                    app_client_id: clientId || config.WORKABLE_CLIENT_ID,
                    app_client_secret: clientSecret || config.WORKABLE_CLIENT_SECRET,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId: environmentId,
                    app_config: { org_url: orgURL || config.WORKABLE_ORG_URL },
                    tp_account_url: orgURL,
                },
                update: {
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token,
                    app_client_id: clientId || config.WORKABLE_CLIENT_ID,
                    app_client_secret: clientSecret || config.WORKABLE_CLIENT_SECRET,
                    tp_id: integrationId,
                    appId: account?.apps[0].id,
                    tp_customer_id: info.data?.id,
                    app_config: { org_url: orgURL || config.WORKABLE_ORG_URL },
                    tp_account_url: orgURL,
                },
            });

            sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workable, result.data.access_token, info.data?.id);

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: info.data?.id,
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

export default new WorkableAuthHandler();
