import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';
import { normalizeWorkableSubdomain } from '../../../../helpers/ats/workable';

/**
 * Workable uses API token auth (subdomain + token).
 * Docs: https://workable.readme.io/reference/generate-an-access-token
 * `code` is the API token; subdomain comes from app_config.subdomain or ?subdomain= query.
 */
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
        try {
            const token = typeof code === 'string' ? code.trim() : '';
            if (!token) {
                throw new Error('Workable API token (code) is required');
            }

            const fromQuery = normalizeWorkableSubdomain(request?.query?.subdomain);
            const fromConfig = normalizeWorkableSubdomain(
                (account?.apps?.[0]?.app_config as { subdomain?: string } | null)?.subdomain,
            );
            const subdomain = fromQuery || fromConfig;
            if (!subdomain) {
                throw new Error(
                    'Workable subdomain is required. Set app_config.subdomain (e.g. "acme") or pass ?subdomain=acme',
                );
            }

            const tpCustomerId = `Workable:${subdomain}`;

            await xprisma.connections.upsert({
                where: {
                    id: tenantId,
                },
                update: {
                    tp_access_token: token,
                    tp_refresh_token: null,
                    app_client_id: null,
                    app_client_secret: null,
                    tp_id: integrationId,
                    appId: account?.apps[0].id,
                    tp_customer_id: tpCustomerId,
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: token,
                    app_client_id: null,
                    app_client_secret: null,
                    tp_customer_id: tpCustomerId,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId: environmentId,
                },
            });

            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workable, token, tpCustomerId);

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId,
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
