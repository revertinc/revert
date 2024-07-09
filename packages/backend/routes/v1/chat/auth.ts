import express from 'express';
import prisma from '../../../prisma/client';
import { logInfo, logDebug } from '../../../helpers/logger';
import { TP_ID } from '@prisma/client';
import AuthService from '../../../services/auth';
import { randomUUID } from 'crypto';
import redis from '../../../redis/client';
import { mapIntegrationIdToIntegrationName } from '../../../constants/common';
import processOAuthResult from '../../../helpers/auth/processOAuthResult';
import slack from './authHandlers/slack';
import discord from './authHandlers/discord';

const authRouter = express.Router();

/**
 * OAuth API
 */
authRouter.get('/oauth-callback', async (req, res) => {
    logInfo('OAuth callback', req.query);
    const integrationId = req.query.integrationId as TP_ID; // add TP_ID alias after
    const revertPublicKey = req.query.x_revert_public_token as string;
    const redirect_url = req.query?.redirect_url;
    const redirectUrl = redirect_url ? (redirect_url as string) : undefined;

    // generate a token for connection auth and save in redis for 5 mins
    const tenantSecretToken = randomUUID();
    logDebug('blah tenantSecretToken', tenantSecretToken);
    await redis.setEx(`tenantSecretToken_${req.query.t_id}`, 5 * 60, tenantSecretToken);

    try {
        const account = await prisma.environments.findFirst({
            where: {
                public_token: String(revertPublicKey),
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

        const clientId = account?.apps[0]?.is_revert_app ? undefined : account?.apps[0]?.app_client_id;
        const clientSecret = account?.apps[0]?.is_revert_app ? undefined : account?.apps[0]?.app_client_secret;

        const svixAppId = account!.accounts!.id;
        const environmentId = account?.id;

        const authProps = {
            account,
            clientId,
            clientSecret,
            code: req.query.code as string,
            integrationId,
            revertPublicKey,
            svixAppId,
            environmentId,
            tenantId: String(req.query.t_id),
            tenantSecretToken,
            response: res,
            request: req,
            redirectUrl,
        };

        if (req.query.code && req.query.t_id && revertPublicKey) {
            switch (integrationId) {
                case TP_ID.slack:
                    return slack.handleOAuth(authProps);
                case TP_ID.discord:
                    return discord.handleOAuth(authProps);

                default:
                    return processOAuthResult({
                        status: false,
                        revertPublicKey,
                        tenantSecretToken,
                        response: res,
                        tenantId: req.query.t_id as string,
                        statusText: 'Not implemented yet',
                        redirectUrl,
                    });
            }
        } else {
            return processOAuthResult({
                status: false,
                revertPublicKey,
                tenantSecretToken,
                response: res,
                tenantId: req.query.t_id as string,
                statusText: 'noop',
                redirectUrl,
            });
        }
    } catch (error: any) {
        return processOAuthResult({
            error,
            revertPublicKey,
            integrationName: mapIntegrationIdToIntegrationName[integrationId],
            tenantSecretToken,
            response: res,
            tenantId: req.query.t_id as string,
            status: false,
            statusText: 'Error while getting oauth creds',
            redirectUrl,
        });
    }
});

authRouter.get('/oauth/refresh', async (_, res) => {
    res.status(200).send(await AuthService.refreshOAuthTokensForThirdPartyChatServices());
});

export default authRouter;
