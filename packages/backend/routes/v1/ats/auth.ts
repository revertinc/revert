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
import workday from './authHandlers/workday';

const authRouter = express.Router({ mergeParams: true });

interface OAuthCallbackQuery {
    integrationId: ATS_TP_ID;
    revertPublicKey: string;
    tenantId: string;
    code: string;
    redirectUrl?: string;
}

/**
 * Normalizes query parameters supplied to the ATS OAuth callback route.
 */
function parseOAuthCallbackQuery(req: Request): OAuthCallbackQuery {
    const redirectParam = req.query?.redirect_url;
    return {
        integrationId: req.query.integrationId as ATS_TP_ID,
        revertPublicKey: String(req.query.x_revert_public_token || ''),
        tenantId: String(req.query.t_id || ''),
        code: String(req.query.code || ''),
        redirectUrl: redirectParam ? String(redirectParam) : undefined,
    };
}

/**
 * Loads the Revert environment and tenant-configured ATS application credentials.
 */
async function fetchEnvironmentAccount(revertPublicKey: string, integrationId: ATS_TP_ID) {
    return prisma.environments.findFirst({
        where: {
            public_token: revertPublicKey,
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
                where: { tp_id: integrationId },
            },
            accounts: true,
        },
    });
}

/**
 * Assembles the standardized IntegrationAuthProps payload for ATS auth handlers.
 */
async function buildIntegrationAuthProps(
    req: Request,
    res: Response
): Promise<{ query: OAuthCallbackQuery; props: IntegrationAuthProps }> {
    const query = parseOAuthCallbackQuery(req);
    const tenantSecretToken = randomUUID();
    logDebug('Generated tenantSecretToken for ATS callback', tenantSecretToken);
    await redis.setEx(`tenantSecretToken_${req.query.t_id}`, 5 * 60, tenantSecretToken);

    const account = await fetchEnvironmentAccount(query.revertPublicKey, query.integrationId);
    const primaryApp = account?.apps[0];
    const isManagedByRevert = Boolean(primaryApp?.is_revert_app);

    return {
        query,
        props: {
            account,
            clientId: isManagedByRevert ? undefined : primaryApp?.app_client_id,
            clientSecret: isManagedByRevert ? undefined : primaryApp?.app_client_secret,
            code: query.code,
            integrationId: query.integrationId,
            revertPublicKey: query.revertPublicKey,
            svixAppId: account!.id,
            environmentId: account?.id,
            tenantId: query.tenantId,
            tenantSecretToken,
            response: res,
            request: req,
            redirectUrl: query.redirectUrl,
        },
    };
}

/**
 * Dispatches the OAuth or Basic credential exchange to the matching ATS provider handler.
 */
async function dispatchAtsProviderAuth(props: IntegrationAuthProps) {
    switch (props.integrationId) {
        case TP_ID.greenhouse:
            return greenhouse.handleBasicAuth(props);
        case TP_ID.lever:
            return lever.handleOAuth(props);
        case TP_ID.workday:
            return workday.handleOAuth(props);
        default:
            return processOAuthResult({
                status: false,
                revertPublicKey: props.revertPublicKey,
                tenantSecretToken: props.tenantSecretToken,
                response: props.response,
                tenantId: props.tenantId,
                statusText: 'Not implemented yet',
                redirectUrl: props.redirectUrl,
            });
    }
}

/**
 * Validates whether all required query parameters for completing an ATS connection are present.
 */
function hasRequiredOAuthParams(query: OAuthCallbackQuery): boolean {
    return Boolean(query.code && query.tenantId && query.revertPublicKey);
}

authRouter.get('/oauth-callback', async (req, res) => {
    logInfo('OAuth callback', req.query);
    const query = parseOAuthCallbackQuery(req);

    try {
        const { props } = await buildIntegrationAuthProps(req, res);
        if (!hasRequiredOAuthParams(query)) {
            return processOAuthResult({
                status: false,
                revertPublicKey: query.revertPublicKey,
                tenantSecretToken: props.tenantSecretToken,
                response: res,
                tenantId: query.tenantId,
                statusText: 'noop',
                redirectUrl: query.redirectUrl,
            });
        }
        return await dispatchAtsProviderAuth(props);
    } catch (error: any) {
        return processOAuthResult({
            status: false,
            error,
            revertPublicKey: query.revertPublicKey,
            integrationName: mapIntegrationIdToIntegrationName[query.integrationId],
            tenantSecretToken: '',
            response: res,
            tenantId: query.tenantId,
            statusText: 'Error while getting oauth creds',
            redirectUrl: query.redirectUrl,
        });
    }
});

export default authRouter;
