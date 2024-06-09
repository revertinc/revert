import express from 'express';
import { randomUUID } from 'crypto';
import { logInfo } from '../../../helpers/logger';
import { mapIntegrationIdToIntegrationName } from '../../../constants/common';
import redis from '../../../redis/client';
import { TP_ID } from '@prisma/client';
import prisma from '../../../prisma/client';
import processOAuthResult from '../../../helpers/auth/processOAuthResult';
import linear from './authHandlers/linear';
import clickup from './authHandlers/clickup';
import trello from './authHandlers/trello';
import bitbucket from './authHandlers/bitbucket';
import jira from './authHandlers/jira';

const authRouter = express.Router();

authRouter.get('/oauth-callback', async (req, res) => {
    logInfo('OAuth callback', req.query);
    const integrationId = req.query.integrationId as TP_ID;
    const revertPublicKey = req.query.x_revert_public_token as string;
    const redirect_url = req.query?.redirect_url;
    const redirectUrl = redirect_url ? (redirect_url as string) : undefined;
    // generate a token for connection auth and save in redis for 5 mins
    const tenantSecretToken = randomUUID();
    await redis.setEx(`tenantSecretToken_${req.query.t_id}`, 5 * 60, tenantSecretToken);

    try {
        const account = await prisma.environments.findFirst({
            where: {
                public_token: String(revertPublicKey),
            },
            include: {
                apps: {
                    select: { id: true, app_client_id: true, app_client_secret: true, is_revert_app: true },
                    where: { tp_id: integrationId },
                },
                accounts: true,
            },
        });

        const clientId = account?.apps[0]?.is_revert_app ? undefined : account?.apps[0]?.app_client_id;
        const clientSecret = account?.apps[0]?.is_revert_app ? undefined : account?.apps[0]?.app_client_secret;
        const svixAppId = account!.id; // breaking change
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
                case TP_ID.linear:
                    return linear.handleOAuth(authProps);
                case TP_ID.clickup:
                    return clickup.handleOAuth(authProps);
                case TP_ID.trello:
                    return trello.handleOAuth(authProps);
                case TP_ID.jira:
                    return jira.handleOAuth(authProps);
                case TP_ID.bitbucket:
                    return bitbucket.handleOAuth(authProps);

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
        }

        return processOAuthResult({
            status: false,
            revertPublicKey,
            tenantSecretToken,
            response: res,
            tenantId: req.query.t_id as string,
            statusText: 'noop',
            redirectUrl,
        });
    } catch (error: any) {
        return processOAuthResult({
            status: false,
            error,
            revertPublicKey,
            integrationName: mapIntegrationIdToIntegrationName[integrationId],
            tenantSecretToken,
            response: res,
            tenantId: req.query.t_id as string,
            statusText: 'Error while getting oauth creds',
            redirectUrl,
        });
    }
});

export default authRouter;
