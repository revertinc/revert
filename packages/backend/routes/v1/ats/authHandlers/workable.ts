import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { AppConfig, IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';

class WorkableAuthHandler extends BaseOAuthHandler {
    async handleBasicAuth({
        account,
        code, //code for basic auth types like workable is the api access token
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
            // Every Workable account lives on its own subdomain (https://{subdomain}.workable.com).
            // It is collected per connection during the connect flow (like the Jira/Zoho base urls)
            // and can alternatively be pre-configured on the app itself.
            const subdomain =
                (request?.query?.subdomain as string) || (account?.apps[0]?.app_config as AppConfig)?.subdomain;

            if (!subdomain) {
                return processOAuthResult({
                    status: false,
                    revertPublicKey,
                    tenantSecretToken,
                    response,
                    tenantId: tenantId,
                    integrationName: mapIntegrationIdToIntegrationName[integrationId],
                    statusText:
                        'Workable subdomain is required to connect a Workable account. Pass it as the "subdomain" query parameter or configure it on the app.',
                    redirectUrl,
                });
            }

            const accountUrl = `https://${subdomain}.workable.com`;

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
                    tp_customer_id: 'Workable user',
                    tp_account_url: accountUrl,
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: code,
                    app_client_id: null,
                    app_client_secret: null,
                    tp_customer_id: 'Workable user',
                    tp_account_url: accountUrl,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId: environmentId,
                },
            });

            // svix stuff here
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
