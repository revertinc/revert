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
        request,
        redirectUrl,
    }: IntegrationAuthProps) {
        const resolvedClientId = clientId || config.WORKABLE_CLIENT_ID;
        const resolvedClientSecret = clientSecret || config.WORKABLE_CLIENT_SECRET;
        const subdomain =
            (request?.query?.subdomain as string | undefined) ||
            (account?.apps?.[0]?.app_config as AppConfig)?.subdomain;

        if (request?.query?.authType === 'apikey' || (!resolvedClientId && !resolvedClientSecret)) {
            return this.handleBasicAuth({
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
                redirectUrl,
            });
        }

        try {
            const formData = {
                grant_type: 'authorization_code',
                client_id: resolvedClientId,
                client_secret: resolvedClientSecret,
                code: code,
                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/workable`,
            };

            const url = 'https://www.workable.com/oauth/token';

            const result: any = await axios({
                method: 'post',
                url: url,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: qs.stringify(formData),
            });

            logInfo('OAuth creds for Workable', result.data);

            const accessToken = result.data.access_token;
            const refreshToken = result.data.refresh_token ?? null;
            const accountUrl =
                result.data.account_url ||
                (subdomain ? `https://${subdomain}.workable.com` : undefined);

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
                    tp_account_url: accountUrl,
                    tp_customer_id: 'Workable_user',
                    app_client_id: resolvedClientId,
                    app_client_secret: resolvedClientSecret,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0]?.id,
                    environmentId: environmentId,
                },
                update: {
                    tp_access_token: accessToken,
                    tp_refresh_token: refreshToken,
                    ...(accountUrl && { tp_account_url: accountUrl }),
                    app_client_id: resolvedClientId,
                    app_client_secret: resolvedClientSecret,
                    tp_id: integrationId,
                    appId: account?.apps[0]?.id,
                    tp_customer_id: 'Workable_user',
                },
            });

            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workable, accessToken, 'Workable_user');

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
        request,
        redirectUrl,
    }: IntegrationAuthProps) {
        try {
            const subdomain =
                (request?.query?.subdomain as string | undefined) ||
                (account?.apps?.[0]?.app_config as AppConfig)?.subdomain;
            const accountUrl = subdomain
                ? subdomain.startsWith('http')
                    ? subdomain
                    : `https://${subdomain}.workable.com`
                : null;

            await xprisma.connections.upsert({
                where: {
                    id: tenantId,
                },
                update: {
                    tp_access_token: code,
                    tp_refresh_token: null,
                    ...(accountUrl && { tp_account_url: accountUrl }),
                    app_client_id: null,
                    app_client_secret: null,
                    tp_id: integrationId,
                    appId: account?.apps[0]?.id,
                    tp_customer_id: 'Workable_user',
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: code,
                    tp_account_url: accountUrl,
                    app_client_id: null,
                    app_client_secret: null,
                    tp_customer_id: 'Workable_user',
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0]?.id,
                    environmentId: environmentId,
                },
            });

            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workable, code, 'Workable_user');

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
