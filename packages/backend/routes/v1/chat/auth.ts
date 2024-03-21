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
                    });
            }
        } else if (integrationId === TP_ID.gdrive && req.query.code && revertPublicKey) {
            const formData = {
                client_id: clientId || config.GDRIVE_CLIENT_ID,
                client_secret: clientSecret || config.GDRIVE_CLIENT_SECRET,
                scope: String(req.query.scopes).split(',').join(' '),
                code: req.query.code,
                redirect_uri: 'http://localhost:3000/oauth-callback/gdrive',
                grant_type: 'authorization_code',
            };

            const result: any = await axios({
                method: 'post',
                url: `https://oauth2.googleapis.com/token`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: formData,
            });

            logInfo('OAuth creds for Google Drive', result.data);

            const info: any = await axios({
                method: 'get',
                url: `https://www.googleapis.com/drive/v3/files`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Bearer ${result.data.access_token}`,
                },
            });

            logInfo('OAuth token info', info.data);

            try {
                // prisma
                await xprisma.connections.upsert({
                    where: {
                        id: String(req.query.t_id),
                    },
                    update: {
                        tp_access_token: result.data?.access_token,
                        tp_refresh_token: result.data?.refresh_token,
                        app_client_id: clientId || config.GDRIVE_CLIENT_ID,
                        app_client_secret: clientSecret || config.GDRIVE_CLIENT_SECRET,
                    },
                    create: {
                        id: String(req.query.t_id),
                        t_id: req.query.t_id as string,
                        tp_id: integrationId,
                        tp_access_token: String(result.data?.access_token),
                        tp_refresh_token: String(result.data?.refresh_token),
                        app_client_id: clientId || config.GDRIVE_CLIENT_ID,
                        app_client_secret: clientSecret || config.GDRIVE_CLIENT_SECRET,
                        tp_customer_id: String(info.data.id),
                        owner_account_public_token: revertPublicKey,
                        appId: account?.apps[0].id,
                    },
                });
                // svix
                config.svix?.message.create(svixAppId, {
                    eventType: 'connection.added',
                    payload: {
                        eventType: 'connection.added',
                        connection: {
                            t_id: req.query.t_id as string,
                            tp_id: TP_ID.gdrive,
                            tp_access_token: String(result.data?.access_token),
                            tp_customer_id: String(info.data.id),
                        },
                    },
                    channels: [req.query.t_id as string],
                });

                // pubsub
                await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${req.query.t_id}`, {
                    publicToken: revertPublicKey,
                    status: 'SUCCESS',
                    integrationName: mapIntegrationIdToIntegrationName[integrationId],
                    tenantId: req.query.t_id,
                    tenantSecretToken,
                } as IntegrationStatusSseMessage);

                res.send({ status: 'ok', tp_customer_id: info.data.id });
            } catch (error: any) {
                logError(error);
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    if (error?.code === 'P2002') {
                        console.error(
                            'There is a unique constraint violation, a new user cannot be created with this email'
                        );
                    }
                }
                console.error('Could not update db', error);
                await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${req.query.t_id}`, {
                    publicToken: revertPublicKey,
                    status: 'FAILED',
                    integrationName: mapIntegrationIdToIntegrationName[integrationId],
                    tenantId: req.query.t_id,
                    tenantSecretToken,
                } as IntegrationStatusSseMessage);
                res.send({ status: 'error', error: error });
            }
        } else {
            return processOAuthResult({
                status: false,
                revertPublicKey,
                tenantSecretToken,
                response: res,
                tenantId: req.query.t_id as string,
                statusText: 'noop',
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
        });
    }
});

authRouter.get('/oauth/refresh', async (_, res) => {
    res.status(200).send(await AuthService.refreshOAuthTokensForThirdPartyChatServices());
});

export default authRouter;
