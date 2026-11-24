import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';

class WorkableAuthHandler extends BaseOAuthHandler {
    async handleBasicAuth({
        account,
        code, //code for basic auth types like workable is the api token
        integrationId,
        revertPublicKey,
        svixAppId,
        environmentId,
        tenantId,
        tenantSecretToken,
        response,
        redirectUrl,
        request,
    }: IntegrationAuthProps) {
        try {
            const subdomain = request?.query?.subdomain;
            if (!subdomain) {
                return processOAuthResult({
                    status: false,
                    error: new Error(
                        'The query parameter "subdomain", which is the Workable account subdomain, is required.'
                    ),
                    revertPublicKey,
                    tenantSecretToken,
                    response,
                    tenantId: tenantId,
                    integrationName: mapIntegrationIdToIntegrationName[integrationId],
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
                    tp_account_url: accountUrl,
                    app_client_id: null,
                    app_client_secret: null,
                    tp_customer_id: 'Workable user',
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
