import axios from 'axios';
import qs from 'qs';
import { TP_ID } from '@prisma/client';
import config from '../../../../config';
import { logInfo } from '../../../../helpers/logger';
import { xprisma } from '../../../../prisma/client';
import { AppConfig, IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';

const WORKDAY_CUSTOMER_ID = 'Workday_user';
const DEFAULT_WORKDAY_DOMAIN = 'https://wd2-impl-services1.workday.com';

export interface WorkdayTokenResponse {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
}

export interface WorkdayRefreshInput {
    connectionId: string;
    refreshToken: string;
    clientId?: string | null;
    clientSecret?: string | null;
    tokenUrl?: string | null;
    appConfig?: AppConfig | null;
}

interface TokenExchangeRequest {
    tokenUrl: string;
    payload: Record<string, string | undefined>;
}

interface ResolvedWorkdayAppContext {
    appId?: string;
    clientId?: string;
    clientSecret?: string;
    tokenUrl: string;
}

/**
 * Resolves the tenant-scoped Workday OAuth 2.0 token endpoint.
 * Workday REST APIs require tenant-specific token URLs formatted as
 * https://{workday_host}/ccx/oauth2/{tenant_name}/token unless an explicit
 * full token endpoint is configured on the application record.
 */
export function resolveWorkdayTokenUrl(appConfig?: AppConfig | null, explicitUrl?: string | null): string {
    const baseSource = explicitUrl || appConfig?.org_url || config.WORKDAY_TOKEN_URL || DEFAULT_WORKDAY_DOMAIN;
    const normalizedBase = baseSource.replace(/\/+$/, '');
    if (normalizedBase.endsWith('/token')) {
        return normalizedBase;
    }
    const tenantName = appConfig?.tenant_name || 'default';
    return `${normalizedBase}/ccx/oauth2/${tenantName}/token`;
}

/**
 * Extracts the tenant's application configuration and OAuth client credentials
 * with fallback to environment-level Revert managed credentials.
 */
function resolveWorkdayAppContext(props: IntegrationAuthProps): ResolvedWorkdayAppContext {
    const primaryApp = props.account?.apps?.[0];
    const appConfig = primaryApp?.app_config as AppConfig | undefined;
    return {
        appId: primaryApp?.id,
        clientId: props.clientId || config.WORKDAY_CLIENT_ID,
        clientSecret: props.clientSecret || config.WORKDAY_CLIENT_SECRET,
        tokenUrl: resolveWorkdayTokenUrl(appConfig),
    };
}

/**
 * Executes an application/x-www-form-urlencoded token request against the
 * Workday OAuth 2.0 authorization server for either initial code exchange
 * or refresh token rotation.
 */
async function requestWorkdayTokens(request: TokenExchangeRequest): Promise<WorkdayTokenResponse> {
    const response = await axios({
        method: 'post',
        url: request.tokenUrl,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: qs.stringify(request.payload),
    });
    return response.data as WorkdayTokenResponse;
}

/**
 * Persists the tenant's Workday OAuth 2.0 credentials and resolved token
 * endpoint into the unified connections table so downstream ATS proxy and
 * unified resource handlers can authenticate tenant API calls.
 */
async function upsertWorkdayConnection(props: IntegrationAuthProps, tokens: WorkdayTokenResponse) {
    const context = resolveWorkdayAppContext(props);
    const refreshToken = tokens.refresh_token || null;
    const sharedFields = {
        tp_access_token: tokens.access_token,
        tp_refresh_token: refreshToken,
        tp_account_url: context.tokenUrl,
        app_client_id: context.clientId,
        app_client_secret: context.clientSecret,
        tp_id: props.integrationId,
        appId: context.appId,
        tp_customer_id: WORKDAY_CUSTOMER_ID,
    };

    await xprisma.connections.upsert({
        where: { id: props.tenantId },
        create: {
            id: props.tenantId,
            t_id: props.tenantId,
            owner_account_public_token: props.revertPublicKey,
            environmentId: props.environmentId,
            ...sharedFields,
        },
        update: sharedFields,
    });
}

class WorkdayAuthHandler extends BaseOAuthHandler {
    /**
     * Completes the OAuth 2.0 authorization code grant for a Workday tenant,
     * stores the resulting access and refresh tokens, and notifies Svix webhooks.
     */
    async handleOAuth(props: IntegrationAuthProps) {
        const context = resolveWorkdayAppContext(props);
        const payload = {
            grant_type: 'authorization_code',
            client_id: context.clientId,
            client_secret: context.clientSecret,
            code: props.code,
            redirect_uri: `${config.OAUTH_REDIRECT_BASE}/workday`,
        };

        try {
            const tokenData = await requestWorkdayTokens({ tokenUrl: context.tokenUrl, payload });
            logInfo('OAuth creds for Workday', tokenData);

            await upsertWorkdayConnection(props, tokenData);
            await sendConnectionAddedEvent(
                props.svixAppId,
                props.tenantId,
                TP_ID.workday,
                tokenData.access_token,
                WORKDAY_CUSTOMER_ID
            );

            return processOAuthResult({
                status: true,
                revertPublicKey: props.revertPublicKey,
                tenantSecretToken: props.tenantSecretToken,
                response: props.response,
                tenantId: props.tenantId,
                integrationName: mapIntegrationIdToIntegrationName[props.integrationId],
                tpCustomerId: WORKDAY_CUSTOMER_ID,
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
                integrationName: mapIntegrationIdToIntegrationName[props.integrationId],
                redirectUrl: props.redirectUrl,
            });
        }
    }

    /**
     * Exchanges a stored Workday refresh token for a new access token and
     * updates the tenant connection record in place.
     */
    async refreshAccessToken(input: WorkdayRefreshInput): Promise<WorkdayTokenResponse> {
        const tokenUrl = resolveWorkdayTokenUrl(input.appConfig, input.tokenUrl);
        const payload = {
            grant_type: 'refresh_token',
            client_id: input.clientId || config.WORKDAY_CLIENT_ID,
            client_secret: input.clientSecret || config.WORKDAY_CLIENT_SECRET,
            refresh_token: input.refreshToken,
        };

        const tokenData = await requestWorkdayTokens({ tokenUrl, payload });
        await xprisma.connections.update({
            where: { id: input.connectionId },
            data: {
                tp_access_token: tokenData.access_token,
                tp_refresh_token: tokenData.refresh_token || input.refreshToken,
            },
        });
        return tokenData;
    }
}

export default new WorkdayAuthHandler();
