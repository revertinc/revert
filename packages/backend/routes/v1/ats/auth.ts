import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { TP_ID } from '@prisma/client';
import prisma from '../../../prisma/client';
import { logInfo, logDebug } from '../../../helpers/logger';
import processOAuthResult from '../../../helpers/auth/processOAuthResult';
import redis from '../../../redis/client';
import { ATS_TP_ID, IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../constants/common';
import greenhouse from './authHandlers/greenhouse';
import lever from './authHandlers/lever';
import workable, { WORKABLE_TP_ID } from './authHandlers/workable';

const authRouter = express.Router({ mergeParams: true });

/**
 * Normalized query parameters extracted from an inbound ATS OAuth redirect request.
 */
interface AtsCallbackQuery {
    integrationId: ATS_TP_ID;
    revertPublicKey: string;
    redirectUrl?: string;
    tenantId: string;
    rawTenantId: unknown;
    code: string;
}

/**
 * Request-scoped context required to construct `IntegrationAuthProps` and finalize OAuth status notifications.
 */
interface AtsCallbackContext {
    query: AtsCallbackQuery;
    tenantSecretToken: string;
    request: Request;
    response: Response;
}

/**
 * Extracts and normalizes ATS OAuth callback query parameters from the Express request.
 */
function extractCallbackQuery(req: Request): AtsCallbackQuery {
    const redirectParam = req.query?.redirect_url;
    return {
        integrationId: req.query.integrationId as ATS_TP_ID,
        revertPublicKey: req.query.x_revert_public_token as string,
        redirectUrl: redirectParam ? String(redirectParam) : undefined,
        tenantId: String(req.query.t_id),
        rawTenantId: req.query.t_id,
        code: req.query.code as string,
    };
}

/**
 * Validates that the OAuth callback carries the mandatory authorization code, tenant ID, and public token.
 */
function hasRequiredCallbackParams(query: AtsCallbackQuery): boolean {
    if (!query.code) {
        return false;
    }
    if (!query.rawTenantId) {
        return false;
    }
    return Boolean(query.revertPublicKey);
}

/**
 * Queries the tenant environment and third-party OAuth application configuration associated with the public token.
 */
async function findEnvironmentAccount(query: AtsCallbackQuery) {
    return prisma.environments.findFirst({
        where: {
            public_token: String(query.revertPublicKey),
        },
        include: {
            apps: {
                select: {
                    id: true,
                    app_client_id: true,
                    app_client_secret: true,
                    is_revert_app: true,
                    app_config: true,
                },
                where: { tp_id: query.integrationId },
            },
            accounts: true,
        },
    });
}

/**
 * Resolves a tenant-managed OAuth client credential or returns undefined when Revert-managed credentials apply.
 */
function resolveCustomAppCredential(
    app: { is_revert_app?: boolean; app_client_id?: string | null; app_client_secret?: string | null } | undefined,
    field: 'app_client_id' | 'app_client_secret',
): string | null | undefined {
    if (!app || app.is_revert_app) {
        return undefined;
    }
    return app[field];
}

/**
 * Assembles the unified authentication handler payload shared across ATS provider implementations.
 */
function buildHandleAuthProps(context: AtsCallbackContext, account: any): IntegrationAuthProps {
    const primaryApp = account?.apps?.[0];
    return {
        account,
        clientId: resolveCustomAppCredential(primaryApp, 'app_client_id'),
        clientSecret: resolveCustomAppCredential(primaryApp, 'app_client_secret'),
        code: context.query.code,
        integrationId: context.query.integrationId,
        revertPublicKey: context.query.revertPublicKey,
        svixAppId: account!.id,
        environmentId: account?.id,
        tenantId: context.query.tenantId,
        tenantSecretToken: context.tenantSecretToken,
        response: context.response,
        request: context.request,
        redirectUrl: context.query.redirectUrl,
    };
}

/**
 * Routes the verified ATS callback payload to the corresponding third-party authentication handler.
 */
async function dispatchAtsProviderAuth(handleAuthProps: IntegrationAuthProps) {
    switch (handleAuthProps.integrationId as TP_ID) {
        case TP_ID.greenhouse:
            return greenhouse.handleBasicAuth(handleAuthProps);
        case TP_ID.lever:
            return lever.handleOAuth(handleAuthProps);
        case WORKABLE_TP_ID:
            return workable.handleOAuth(handleAuthProps);
        default:
            return processOAuthResult({
                status: false,
                revertPublicKey: handleAuthProps.revertPublicKey,
                tenantSecretToken: handleAuthProps.tenantSecretToken,
                response: handleAuthProps.response,
                tenantId: handleAuthProps.tenantId,
                statusText: 'Not implemented yet',
                redirectUrl: handleAuthProps.redirectUrl,
            });
    }
}

/**
 * Handles `/oauth-callback` redirects for ATS integrations by issuing a short-lived Redis session token,
 * loading the environment's app configuration, and delegating credential exchange to the provider handler.
 */
authRouter.get('/oauth-callback', async (req, res) => {
    logInfo('OAuth callback', req.query);
    const query = extractCallbackQuery(req);

    // Issue a 5-minute ephemeral token in Redis to authorize the frontend connection status handshake.
    const tenantSecretToken = randomUUID();
    logDebug('blah tenantSecretToken', tenantSecretToken);
    await redis.setEx(`tenantSecretToken_${query.rawTenantId}`, 5 * 60, tenantSecretToken);

    const context: AtsCallbackContext = {
        query,
        tenantSecretToken,
        request: req,
        response: res,
    };

    try {
        const account = await findEnvironmentAccount(query);
        if (!hasRequiredCallbackParams(query)) {
            return processOAuthResult({
                status: false,
                revertPublicKey: query.revertPublicKey,
                tenantSecretToken,
                response: res,
                tenantId: query.rawTenantId as string,
                statusText: 'noop',
                redirectUrl: query.redirectUrl,
            });
        }

        const handleAuthProps = buildHandleAuthProps(context, account);
        return await dispatchAtsProviderAuth(handleAuthProps);
    } catch (error: any) {
        return processOAuthResult({
            status: false,
            error,
            revertPublicKey: query.revertPublicKey,
            integrationName: mapIntegrationIdToIntegrationName[query.integrationId],
            tenantSecretToken,
            response: res,
            tenantId: query.rawTenantId as string,
            statusText: 'Error while getting oauth creds',
            redirectUrl: query.redirectUrl,
        });
    }
});

export default authRouter;
