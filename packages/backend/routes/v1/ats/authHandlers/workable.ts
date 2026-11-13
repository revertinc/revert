import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';

// Workable authenticates with a static account API token (Settings >
// Integrations > API Access in the Workable account). There is no OAuth
// flow. The token alone is not enough to reach the API: every Workable
// account lives on its own subdomain (https://{subdomain}.workable.com),
// so the connect step collects `code` as "<subdomain>:<apiToken>" and the
// subdomain is stored on the connection as tp_customer_id, which is the
// third-party account identifier the ATS services use to build the base URL.
class WorkableAuthHandler extends BaseOAuthHandler {
    async handleBasicAuth({
        account,
        code, // "<workable-subdomain>:<api-token>" for API-key auth types like workable
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
            const separatorIndex = code.indexOf(':');
            if (separatorIndex <= 0 || separatorIndex === code.length - 1) {
                throw new Error(
                    'Workable connection requires the account subdomain and API token in the form "<subdomain>:<api-token>".',
                );
            }
            const subdomain = code.slice(0, separatorIndex).trim();
            const apiToken = code.slice(separatorIndex + 1).trim();

            await xprisma.connections.upsert({
                where: {
                    id: tenantId,
                },
                update: {
                    tp_access_token: apiToken,
                    tp_refresh_token: undefined,
                    app_client_id: null,
                    app_client_secret: undefined,
                    tp_id: integrationId,
                    appId: account?.apps[0].id,
                    tp_customer_id: subdomain,
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: apiToken,
                    app_client_id: null,
                    app_client_secret: undefined,
                    tp_customer_id: subdomain,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId: environmentId,
                },
            });

            // svix stuff here
            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workable, apiToken, subdomain);

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
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
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                redirectUrl,
            });
        }
    }
}

export default new WorkableAuthHandler();
