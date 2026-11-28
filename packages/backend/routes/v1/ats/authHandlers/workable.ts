import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { logInfo } from '../../../../helpers/logger';
import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName, AppConfig } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';

const WORKABLE_TOKEN_URL = 'https://www.workable.com/oauth/token';

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
        const formData = {
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: `${config.OAUTH_REDIRECT_BASE}/workable`,
        };

        const result: any = await axios({
            method: 'post',
            url: WORKABLE_TOKEN_URL,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: qs.stringify(formData),
        });

        logInfo('OAuth creds for Workable received', {
            scope: result.data?.scope,
            token_type: result.data?.token_type,
        });

        const appConfig = (account?.apps?.[0]?.app_config as AppConfig & { subdomain?: string }) || {};
        const subdomain = appConfig.subdomain || result.data?.subdomain || '';

        const connectionData = {
            tp_id: (TP_ID as Record<string, string>).workable ?? ('workable' as any),
            tp_access_token: result.data.access_token,
            tp_refresh_token: result.data.refresh_token || '',
            tp_account_url: subdomain ? `https://${subdomain}.workable.com/spi/v3` : 'https://www.workable.com/spi/v3',
            t_id: tenantId,
            environment_id: environmentId,
            account_id: account.id,
        };

        await xprisma.connections.upsert({
            where: {
                t_id_tp_id_environment_id: {
                    t_id: tenantId,
                    tp_id: connectionData.tp_id,
                    environment_id: environmentId,
                },
            },
            update: {
                tp_access_token: connectionData.tp_access_token,
                tp_refresh_token: connectionData.tp_refresh_token,
                tp_account_url: connectionData.tp_account_url,
            },
            create: connectionData,
        });

        await sendConnectionAddedEvent({
            svixAppId,
            tenantId,
            integrationName: mapIntegrationIdToIntegrationName[integrationId] || 'workable',
            revertPublicKey,
            tenantSecretToken,
        });

        return processOAuthResult({
            response,
            redirectUrl,
            status: 'success',
        });
    }
}

export default new WorkableAuthHandler();
