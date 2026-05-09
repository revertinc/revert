import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { AppConfig, IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';
import { getWorkableSubdomain } from '../../../../helpers/ats/workable';

class WorkableAuthHandler extends BaseOAuthHandler {
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
        const appConfig = ((account?.apps[0]?.app_config || {}) as AppConfig) || {};
        const accountUrl =
            (request.query.subdomain as string | undefined) ||
            (request.query.accountURL as string | undefined) ||
            (request.query.accountUrl as string | undefined) ||
            appConfig.subdomain ||
            appConfig.account_subdomain ||
            appConfig.org_url;

        try {
            const subdomain = getWorkableSubdomain({
                app_config: {
                    ...appConfig,
                    ...(accountUrl && { org_url: accountUrl, subdomain: accountUrl }),
                },
                tp_account_url: accountUrl,
            });
            const workableAccountUrl = `https://${subdomain}.workable.com`;
            const storedAppConfig = {
                ...appConfig,
                org_url: workableAccountUrl,
                subdomain,
            };

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
                    appId: account?.apps[0].id,
                    tp_customer_id: subdomain,
                    tp_account_url: workableAccountUrl,
                    app_config: storedAppConfig,
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: code,
                    app_client_id: null,
                    app_client_secret: null,
                    tp_customer_id: subdomain,
                    tp_account_url: workableAccountUrl,
                    app_config: storedAppConfig,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId,
                },
            });

            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workable, code, subdomain);

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: subdomain,
                redirectUrl,
            });
        } catch (error: any) {
            return processOAuthResult({
                status: false,
                error,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                redirectUrl,
            });
        }
    }
}

export default new WorkableAuthHandler();
