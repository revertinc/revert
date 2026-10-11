import axios from 'axios';
import { logInfo, logError } from '../../../../helpers/logger';
import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName, AppConfig } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';
import { extractWorkableSubdomain } from '../../../../helpers/ats/workable';

/**
 * Workable auth handler.
 *
 * Workable uses auto-generated API access tokens (Workable UI → Settings → Integrations →
 * Access token) against a subdomain-scoped base URL:
 *   `Authorization: Bearer <token>` on `https://{account-subdomain}.workable.com/spi/v3/`
 * See https://workable.readme.io/reference/generate-an-access-token
 *
 * The token arrives as `code` in the basic-auth connection flow (same as greenhouse).
 * The account subdomain must be configured beforehand in the app config
 * (`app_config.org_url`, editable in the dashboard "Edit credentials" screen).
 */
class WorkableAuthHandler extends BaseOAuthHandler {
    /**
     * Pre-persist validation: ping a cheap endpoint (`/jobs?limit=1`) to verify both the
     * token and the subdomain before creating the connection.
     */
    private async validateToken(subdomain: string, accessToken: string): Promise<boolean> {
        try {
            const res = await axios.get(`https://${subdomain}.workable.com/spi/v3/jobs?limit=1`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                timeout: 10_000,
            });
            return res.status === 200;
        } catch (error: any) {
            logInfo('Workable token validation failed', error?.response?.status, error?.message);
            return false;
        }
    }

    async handleBasicAuth({
        account,
        code, // for basic auth types like workable this is the API access token
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
            const appConfig = (account?.apps?.[0]?.app_config ?? undefined) as AppConfig | undefined;
            const subdomain = extractWorkableSubdomain({ app: { app_config: appConfig } });
            if (!subdomain) {
                return processOAuthResult({
                    status: false,
                    revertPublicKey,
                    tenantSecretToken,
                    response,
                    tenantId,
                    statusText:
                        'Workable account subdomain is missing — configure it in the integration credentials before connecting',
                    redirectUrl,
                });
            }

            const isValid = await this.validateToken(subdomain, code);
            if (!isValid) {
                return processOAuthResult({
                    status: false,
                    revertPublicKey,
                    tenantSecretToken,
                    response,
                    tenantId,
                    statusText: 'Workable credentials rejected by the API (invalid token or subdomain)',
                    redirectUrl,
                });
            }

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
                    tp_account_url: `https://${subdomain}.workable.com`,
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: code,
                    app_client_id: null,
                    app_client_secret: null,
                    tp_customer_id: subdomain,
                    tp_account_url: `https://${subdomain}.workable.com`,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId: environmentId,
                },
            });

            // svix stuff here
            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workable, code, subdomain);

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
            logError(error as Error);
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
