import axios from 'axios';
import config from '../../../../config';
import { logInfo, logError } from '../../../../helpers/logger';
import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { AppConfig, IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';
import { extractWorkableSubdomain } from '../../../../helpers/ats/workable';

/**
 * Workable ATS authentication handler.
 *
 * Supports both:
 *  1. Direct API Access Token authentication (Workable UI -> Settings -> Integrations -> Access Token).
 *     The token arrives as `code` in the basic-auth connection flow.
 *  2. Standard OAuth2 authorization code exchange (Workable Partner OAuth flow).
 */
export class WorkableAuthHandler extends BaseOAuthHandler {
    /**
     * Verifies that the given access token and subdomain are valid by calling the Workable API.
     */
    private async validateToken(subdomain: string, accessToken: string): Promise<boolean> {
        try {
            const res = await axios.get(`https://${subdomain}.workable.com/spi/v3/jobs?limit=1`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                timeout: 10_000,
            });
            return res.status === 200;
        } catch (error: unknown) {
            const axiosErr = error as { response?: { status?: number }; message?: string };
            logInfo('Workable token validation failed', axiosErr?.response?.status, axiosErr?.message);
            return false;
        }
    }

    /**
     * Resolves the account subdomain either from request/app configuration or by querying the
     * Workable /accounts endpoint with the access token.
     */
    private async resolveSubdomain(
        code: string,
        appConfig?: AppConfig,
        request?: IntegrationAuthProps['request'],
    ): Promise<string | undefined> {
        const fromHeader = request?.headers?.['x-revert-tp-subdomain'];
        const fromQuery = (request?.query as Record<string, unknown> | undefined)?.subdomain;
        const requestedSubdomain =
            typeof fromHeader === 'string' ? fromHeader : typeof fromQuery === 'string' ? fromQuery : undefined;

        const fromConfig = extractWorkableSubdomain({
            app: { app_config: appConfig },
            tp_account_url: requestedSubdomain,
        });

        if (fromConfig) {
            return fromConfig;
        }

        // Attempt automatic discovery using the global /accounts endpoint (accessible with all token types)
        try {
            const accountsRes = await axios.get('https://www.workable.com/spi/v3/accounts', {
                headers: {
                    Authorization: `Bearer ${code}`,
                    Accept: 'application/json',
                },
                timeout: 10_000,
            });
            const accounts = accountsRes.data?.accounts;
            if (Array.isArray(accounts) && accounts[0]?.subdomain) {
                return String(accounts[0].subdomain).toLowerCase();
            }
        } catch (err: unknown) {
            const axiosErr = err as { message?: string };
            logInfo('Could not auto-discover Workable subdomain from /accounts endpoint', axiosErr?.message);
        }

        return undefined;
    }

    /**
     * Handles direct API Access Token authentication for Workable.
     */
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
            const appConfig = account?.apps?.[0]?.app_config as AppConfig | undefined;
            const subdomain = await this.resolveSubdomain(code, appConfig, request);

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
                    appId: account?.apps[0]?.id,
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
                    appId: account?.apps[0]?.id,
                    environmentId: environmentId,
                },
            });

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
        } catch (error: unknown) {
            logError(error as Error);
            return processOAuthResult({
                status: false,
                error: error as Error,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                redirectUrl,
            });
        }
    }

    /**
     * Handles standard OAuth2 code exchange flow for Workable.
     */
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
        const effectiveClientId = clientId || config.WORKABLE_CLIENT_ID;
        const effectiveClientSecret = clientSecret || config.WORKABLE_CLIENT_SECRET;
        const formData = {
            grant_type: 'authorization_code',
            client_id: effectiveClientId,
            client_secret: effectiveClientSecret,
            code: code,
            redirect_uri: `${config.OAUTH_REDIRECT_BASE}/workable`,
        };

        try {
            const tokenUrl = config.WORKABLE_TOKEN_URL || 'https://www.workable.com/oauth/token';
            const result = await axios.post(
                tokenUrl,
                new URLSearchParams(formData as Record<string, string>).toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );
            logInfo('OAuth creds for Workable', result.data);

            const accessToken: string = result.data.access_token;
            const refreshToken: string | null = result.data.refresh_token || null;

            // Fetch account information to resolve subdomain and account ID
            let subdomain: string = 'workable_user';
            let customerId: string = 'Workable user';
            try {
                const info = await axios.get('https://www.workable.com/spi/v3/accounts', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: 'application/json',
                    },
                    timeout: 10_000,
                });
                const firstAccount = info.data?.accounts?.[0];
                if (firstAccount?.subdomain) {
                    subdomain = String(firstAccount.subdomain).toLowerCase();
                }
                if (firstAccount?.id) {
                    customerId = String(firstAccount.id);
                }
            } catch (err: unknown) {
                const axiosErr = err as { message?: string };
                logInfo('Workable accounts lookup failed during OAuth', axiosErr?.message);
            }

            const appConfig = account?.apps?.[0]?.app_config as AppConfig | undefined;
            const configuredSubdomain = extractWorkableSubdomain({ app: { app_config: appConfig } });
            const finalSubdomain =
                subdomain && subdomain !== 'workable_user' ? subdomain : configuredSubdomain || subdomain;

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
                    app_client_id: effectiveClientId,
                    app_client_secret: effectiveClientSecret,
                    tp_customer_id: customerId,
                    tp_account_url: `https://${finalSubdomain}.workable.com`,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0]?.id,
                    environmentId: environmentId,
                },
                update: {
                    tp_access_token: accessToken,
                    tp_refresh_token: refreshToken,
                    app_client_id: effectiveClientId,
                    app_client_secret: effectiveClientSecret,
                    tp_id: integrationId,
                    appId: account?.apps[0]?.id,
                    tp_customer_id: customerId,
                    tp_account_url: `https://${finalSubdomain}.workable.com`,
                },
            });

            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workable, accessToken, customerId);

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: customerId,
                redirectUrl,
            });
        } catch (error: unknown) {
            logError(error as Error);
            return processOAuthResult({
                status: false,
                error: error as Error,
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
