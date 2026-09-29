import { TP_ID } from '@prisma/client';
import { AppConfig, IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import { normalizeWorkableSubdomain, validateWorkableCredentials } from '../../../../helpers/ats/workable';
import { xprisma } from '../../../../prisma/client';

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
        const token = typeof code === 'string' ? code.trim() : '';
        const appConfig = (account?.apps?.[0]?.app_config || {}) as AppConfig;
        const rawSubdomain =
            request.query.subdomain ||
            request.query.accountURL ||
            request.query.accountUrl ||
            appConfig.subdomain ||
            appConfig.org_url;
        const subdomain = normalizeWorkableSubdomain(rawSubdomain);

        try {
            if (!token) throw new Error('Workable API token is required');
            if (!subdomain) throw new Error('A valid Workable subdomain is required');

            // Reject bad token/account combinations before a connection is persisted.
            await validateWorkableCredentials(subdomain, token);

            const accountUrl = `https://${subdomain}.workable.com`;
            const connectionConfig = { ...appConfig, org_url: accountUrl, subdomain };

            await xprisma.connections.upsert({
                where: { id: tenantId },
                update: {
                    tp_access_token: token,
                    tp_refresh_token: null,
                    app_client_id: null,
                    app_client_secret: null,
                    tp_id: integrationId,
                    appId: account?.apps[0]?.id,
                    tp_customer_id: subdomain,
                    tp_account_url: accountUrl,
                    app_config: connectionConfig,
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: token,
                    tp_refresh_token: null,
                    app_client_id: null,
                    app_client_secret: null,
                    tp_customer_id: subdomain,
                    tp_account_url: accountUrl,
                    app_config: connectionConfig,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0]?.id,
                    environmentId,
                },
            });

            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workable, token, subdomain);

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
