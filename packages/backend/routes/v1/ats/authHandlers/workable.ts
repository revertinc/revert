import axios from 'axios';
import qs from 'qs';
import { TP_ID } from '@prisma/client';
import config from '../../../../config';
import { logInfo } from '../../../../helpers/logger';
import { xprisma } from '../../../../prisma/client';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName, AppConfig } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';

/**
 * Workable API v3 OAuth 2.0 endpoint constants and default scope set.
 * Workable requires explicit read/write scopes for candidate and job synchronization
 * plus `resource=user` during authorization code initiation.
 */
export const WORKABLE_AUTHORIZE_URL = 'https://www.workable.com/oauth/authorize';
export const WORKABLE_TOKEN_URL = 'https://www.workable.com/oauth/token';
export const WORKABLE_TP_ID = 'workable' as TP_ID;
export const WORKABLE_INTEGRATION_NAME = 'Workable';
export const WORKABLE_CUSTOMER_ID = 'Workable_user';
export const WORKABLE_DEFAULT_SCOPES = ['r_jobs', 'w_jobs', 'r_candidates', 'w_candidates'];

/**
 * Input contract for constructing the Workable OAuth 2.0 user consent redirect URL.
 */
export interface WorkableAuthUrlParams {
    clientId?: string;
    redirectUri?: string;
    scopes?: string[];
    state?: string;
}

/**
 * Input contract for exchanging a Workable OAuth 2.0 authorization code or refresh token.
 */
export interface WorkableTokenRequestParams {
    grantType: 'authorization_code' | 'refresh_token';
    clientId: string;
    clientSecret: string;
    code?: string;
    refreshToken?: string;
    redirectUri?: string;
}

/**
 * Token payload returned by Workable's `/oauth/token` endpoint.
 */
export interface WorkableTokenPayload {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    scope?: string;
}

/**
 * Stored connection record required to rotate an expired Workable OAuth 2.0 access token.
 */
export interface WorkableRefreshConnection {
    id: string;
    tp_refresh_token: string | null;
    app_client_id?: string | null;
    app_client_secret?: string | null;
    app?: {
        is_revert_app?: boolean;
        app_client_id?: string | null;
        app_client_secret?: string | null;
    } | null;
}

/**
 * Resolves the effective OAuth client ID from tenant-scoped app overrides or platform environment configuration.
 */
function resolveWorkableClientId(explicitClientId?: string | null): string {
    const envClientId = (config as Record<string, string | undefined>).WORKABLE_CLIENT_ID || process.env.WORKABLE_CLIENT_ID;
    return explicitClientId || envClientId || '';
}

/**
 * Resolves the effective OAuth client secret from tenant-scoped app overrides or platform environment configuration.
 */
function resolveWorkableClientSecret(explicitClientSecret?: string | null): string {
    const envSecret =
        (config as Record<string, string | undefined>).WORKABLE_CLIENT_SECRET || process.env.WORKABLE_CLIENT_SECRET;
    return explicitClientSecret || envSecret || '';
}

/**
 * Builds the default Revert callback URI registered with Workable OAuth applications.
 */
function resolveWorkableRedirectUri(explicitRedirectUri?: string): string {
    return explicitRedirectUri || `${config.OAUTH_REDIRECT_BASE}/workable`;
}

/**
 * Resolves the display name for Workable connection status events published over Redis SSE.
 */
function resolveIntegrationDisplayName(integrationId: TP_ID): string {
    const mappedName = (mapIntegrationIdToIntegrationName as Record<string, string | undefined>)[integrationId];
    return mappedName || WORKABLE_INTEGRATION_NAME;
}

/**
 * Extracts the optional Workable subdomain/organization URL from the environment app configuration.
 */
function extractAccountOrgUrl(props: IntegrationAuthProps): string | null {
    const appConfig = props.account?.apps?.[0]?.app_config as AppConfig | undefined;
    return appConfig?.org_url || null;
}

/**
 * Serializes form-urlencoded parameters for Workable's OAuth 2.0 token endpoint.
 * Workable rejects undefined form keys, so only parameters pertinent to the active grant type are included.
 */
function buildTokenFormData(params: WorkableTokenRequestParams): Record<string, string> {
    const basePayload: Record<string, string> = {
        grant_type: params.grantType,
        client_id: params.clientId,
        client_secret: params.clientSecret,
    };

    if (params.grantType === 'authorization_code') {
        basePayload.code = params.code || '';
        basePayload.redirect_uri = resolveWorkableRedirectUri(params.redirectUri);
        return basePayload;
    }

    basePayload.refresh_token = params.refreshToken || '';
    return basePayload;
}

/**
 * Executes a POST request against Workable's `/oauth/token` endpoint for either code exchange or token refresh.
 */
async function requestWorkableToken(params: WorkableTokenRequestParams): Promise<WorkableTokenPayload> {
    const formData = buildTokenFormData(params);
    const result = await axios({
        method: 'post',
        url: WORKABLE_TOKEN_URL,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: qs.stringify(formData),
    });

    return result.data as WorkableTokenPayload;
}

/**
 * Persists or updates the tenant's Workable OAuth credentials in the unified `connections` table.
 * Retaining `app_client_id` and `app_client_secret` on the connection record enables background token rotation.
 */
async function upsertWorkableConnection(props: IntegrationAuthProps, tokens: WorkableTokenPayload): Promise<void> {
    const clientId = resolveWorkableClientId(props.clientId);
    const clientSecret = resolveWorkableClientSecret(props.clientSecret);
    const appId = props.account?.apps?.[0]?.id;
    const accountUrl = extractAccountOrgUrl(props);

    await xprisma.connections.upsert({
        where: {
            id: props.tenantId,
        },
        create: {
            id: props.tenantId,
            t_id: props.tenantId,
            tp_id: props.integrationId,
            tp_access_token: tokens.access_token,
            tp_refresh_token: tokens.refresh_token || null,
            tp_customer_id: WORKABLE_CUSTOMER_ID,
            tp_account_url: accountUrl,
            app_client_id: clientId,
            app_client_secret: clientSecret,
            owner_account_public_token: props.revertPublicKey,
            appId,
            environmentId: props.environmentId,
        },
        update: {
            tp_access_token: tokens.access_token,
            tp_refresh_token: tokens.refresh_token || null,
            tp_account_url: accountUrl,
            app_client_id: clientId,
            app_client_secret: clientSecret,
            tp_id: props.integrationId,
            appId,
            tp_customer_id: WORKABLE_CUSTOMER_ID,
        },
    });
}

/**
 * Selects the client credentials applicable to a stored connection during scheduled token refresh.
 * Revert-managed OAuth apps always read platform credentials from environment config rather than tenant overrides.
 */
function resolveRefreshCredentials(connection: WorkableRefreshConnection): { clientId: string; clientSecret: string } {
    if (connection.app?.is_revert_app) {
        return {
            clientId: resolveWorkableClientId(null),
            clientSecret: resolveWorkableClientSecret(null),
        };
    }

    return {
        clientId: resolveWorkableClientId(connection.app_client_id || connection.app?.app_client_id),
        clientSecret: resolveWorkableClientSecret(connection.app_client_secret || connection.app?.app_client_secret),
    };
}

/**
 * Workable ATS OAuth 2.0 handler supporting authorization URL construction, code exchange,
 * connection persistence, Svix webhook dispatch, and refresh token rotation.
 */
export class WorkableAuthHandler extends BaseOAuthHandler {
    /**
     * Generates the Workable OAuth 2.0 authorization URL with `resource=user` required by Workable API v3.
     */
    getAuthorizationUrl(params: WorkableAuthUrlParams = {}): string {
        const scopes = params.scopes?.length ? params.scopes : WORKABLE_DEFAULT_SCOPES;
        const query: Record<string, string> = {
            client_id: resolveWorkableClientId(params.clientId),
            redirect_uri: resolveWorkableRedirectUri(params.redirectUri),
            response_type: 'code',
            resource: 'user',
            scope: scopes.join(' '),
        };

        if (params.state) {
            query.state = params.state;
        }

        return `${WORKABLE_AUTHORIZE_URL}?${qs.stringify(query)}`;
    }

    /**
     * Exchanges an OAuth 2.0 authorization code for an access and refresh token pair at Workable's token endpoint.
     */
    async exchangeAuthorizationCode(props: IntegrationAuthProps): Promise<WorkableTokenPayload> {
        return requestWorkableToken({
            grantType: 'authorization_code',
            clientId: resolveWorkableClientId(props.clientId),
            clientSecret: resolveWorkableClientSecret(props.clientSecret),
            code: props.code,
            redirectUri: resolveWorkableRedirectUri(),
        });
    }

    /**
     * Rotates an expired Workable OAuth 2.0 access token and persists the updated token pair in Prisma.
     */
    async refreshAccessToken(connection: WorkableRefreshConnection): Promise<WorkableTokenPayload | null> {
        if (!connection.tp_refresh_token) {
            return null;
        }

        const credentials = resolveRefreshCredentials(connection);
        const tokens = await requestWorkableToken({
            grantType: 'refresh_token',
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
            refreshToken: connection.tp_refresh_token,
        });

        await xprisma.connections.update({
            where: { id: connection.id },
            data: {
                tp_access_token: tokens.access_token,
                tp_refresh_token: tokens.refresh_token || connection.tp_refresh_token,
            },
        });

        return tokens;
    }

    /**
     * Completes the Workable OAuth 2.0 callback lifecycle by exchanging the authorization code,
     * persisting tenant credentials, emitting the Svix `connection.added` event, and publishing SSE status.
     */
    async handleOAuth(props: IntegrationAuthProps) {
        const integrationName = resolveIntegrationDisplayName(props.integrationId);

        try {
            const tokens = await this.exchangeAuthorizationCode(props);
            logInfo('OAuth creds for Workable', tokens);

            await upsertWorkableConnection(props, tokens);
            await sendConnectionAddedEvent(
                props.svixAppId,
                props.tenantId,
                props.integrationId,
                tokens.access_token,
                WORKABLE_CUSTOMER_ID,
            );

            return processOAuthResult({
                status: true,
                revertPublicKey: props.revertPublicKey,
                tenantSecretToken: props.tenantSecretToken,
                response: props.response,
                tenantId: props.tenantId,
                integrationName,
                tpCustomerId: WORKABLE_CUSTOMER_ID,
                redirectUrl: props.redirectUrl,
            });
        } catch (error: any) {
            return processOAuthResult({
                status: false,
                error,
                revertPublicKey: props.revertPublicKey,
                tenantSecretToken: props.tenantSecretToken,
                response: props.response,
                tenantId: props.tenantId,
                integrationName,
                redirectUrl: props.redirectUrl,
            });
        }
    }
}

export default new WorkableAuthHandler();
