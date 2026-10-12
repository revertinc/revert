import { TP_ID } from '@prisma/client';
import { xprisma } from '../../../../prisma/client';
import { IntegrationAuthProps } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';
import { normalizeWorkableSubdomain, requestWorkable } from '../../../../helpers/ats/workable';

class WorkableAuthHandler extends BaseOAuthHandler {
    async handleBasicAuth({
        account,
        code,
        revertPublicKey,
        svixAppId,
        environmentId,
        tenantId,
        tenantSecretToken,
        response,
        request,
        redirectUrl,
    }: IntegrationAuthProps) {
        const outcome = {
            revertPublicKey,
            tenantSecretToken,
            response,
            tenantId,
            integrationName: 'Workable',
            redirectUrl,
        };
        try {
            if (!account || !environmentId || account.id !== environmentId || !account.apps[0]?.id) {
                throw new Error('Workable app is not configured for this environment');
            }
            if (typeof code !== 'string' || !code.trim()) throw new Error('A Workable API token is required');
            const subdomain = normalizeWorkableSubdomain(request.query.subdomain);
            const token = code.trim();
            await requestWorkable(subdomain, token, { path: 'jobs', method: 'GET', params: { limit: 1 } });

            const credentials = {
                tp_id: TP_ID.workable,
                tp_access_token: token,
                tp_refresh_token: null,
                app_client_id: null,
                app_client_secret: null,
                tp_customer_id: subdomain,
                appId: account.apps[0].id,
            };
            // xprisma scopes the connection ID to environmentId and encrypts tp_customer_id.
            await xprisma.connections.upsert({
                where: { id: tenantId },
                update: credentials,
                create: {
                    ...credentials,
                    id: tenantId,
                    t_id: tenantId,
                    owner_account_public_token: revertPublicKey,
                    environmentId,
                },
            });
            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workable, token, subdomain);
            return processOAuthResult({ ...outcome, status: true, tpCustomerId: subdomain });
        } catch {
            return processOAuthResult({
                ...outcome,
                status: false,
                error: { message: 'Could not connect Workable. Check your subdomain, API token and r_jobs scope.' },
            });
        }
    }
}

export default new WorkableAuthHandler();
