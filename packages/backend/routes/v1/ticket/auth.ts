import express from 'express';
import { randomUUID } from 'crypto';
import { logInfo } from '../../../helpers/logger';
import { mapIntegrationIdToIntegrationName } from '../../../constants/common';
import redis from '../../../redis/client';
import { TP_ID } from '@prisma/client';
import prisma from '../../../prisma/client';
import sendIntegrationStatusError from '../sendIntegrationstatusError';
import handleLinearAuth from './authHandlers/linear';
import handleClickUpAuth from './authHandlers/clickup';
import handleTrelloAuth from './authHandlers/trello';
import handleJiraAuth from './authHandlers/jira';

const authRouter = express.Router();

authRouter.get('/oauth-callback', async (req, res) => {
    logInfo('OAuth callback', req.query);
    const integrationId = req.query.integrationId as TP_ID;
    const revertPublicKey = req.query.x_revert_public_token as string;
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
        const svixAppId = account!.accounts!.id;
        const environmentId = account?.id;

        const handleAuthProps = {
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
        };

        if (req.query.code && req.query.t_id && revertPublicKey) {
            switch (integrationId) {
                case TP_ID.linear:
                    return handleLinearAuth(handleAuthProps);
                case TP_ID.clickup:
                    return handleClickUpAuth(handleAuthProps);
                case TP_ID.trello:
                    return handleTrelloAuth(handleAuthProps);
                case TP_ID.jira:
                    return handleJiraAuth(handleAuthProps);

                default:
                    return sendIntegrationStatusError({
                        revertPublicKey,
                        tenantSecretToken,
                        response: res,
                        tenantId: req.query.t_id as string,
                        errorStatusText: 'Not implemented yet',
                    });
            }
        }

        return sendIntegrationStatusError({
            revertPublicKey,
            tenantSecretToken,
            response: res,
            tenantId: req.query.t_id as string,
            errorStatusText: 'noop',
        });
    } catch (error: any) {
        return sendIntegrationStatusError({
            error,
            revertPublicKey,
            integrationName: mapIntegrationIdToIntegrationName[integrationId],
            tenantSecretToken,
            response: res,
            tenantId: req.query.t_id as string,
            infoMessage: 'Error while getting oauth creds',
        });
    }
});

export default authRouter;
