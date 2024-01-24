import express from 'express';
import config from '../../../config';
import prisma, { xprisma } from '../../../prisma/client';
import { logError, logInfo, logDebug } from '../../../helpers/logger';
import { Prisma, TP_ID } from '@prisma/client';
import AuthService from '../../../services/auth';
import axios, { isAxiosError } from 'axios';
import qs from 'qs';
import { randomUUID } from 'crypto';
import redis from '../../../redis/client';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../../redis/client/pubsub';
import { mapIntegrationIdToIntegrationName } from '../../../constants/common';

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
                        app_bot_token: true,
                    },
                    where: { tp_id: integrationId },
                },
                accounts: true,
            },
        });

        const clientId = account?.apps[0]?.is_revert_app ? undefined : account?.apps[0]?.app_client_id;
        const clientSecret = account?.apps[0]?.is_revert_app ? undefined : account?.apps[0]?.app_client_secret;
        const botToken = account?.apps[0]?.is_revert_app ? undefined : account?.apps[0]?.app_bot_token;
        const svixAppId = account!.accounts!.id;

        if (integrationId === TP_ID.slack && req.query.code && req.query.t_id && revertPublicKey) {
            // handling the slack received code
            const url = 'https://slack.com/api/oauth.v2.access';
            const formData = {
                grant_type: 'authorization_code',
                client_id: clientId || config.SLACK_CLIENT_ID,
                client_secret: clientSecret || config.SLACK_CLIENT_SECRET,
                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/slack`,
                code: req.query.code,
            };

            const result = await axios({
                method: 'post',
                url: url,
                data: qs.stringify(formData),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            logInfo('OAuth creds for slack', result.data);

            const info = await axios({
                method: 'get',
                url: 'https://slack.com/api/users.info',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Bearer ${result.data.access_token}`,
                },
                params: {
                    user: result.data.authed_user.id,
                },
            });

            logInfo('OAuth token info', info.data);

            try {
                await xprisma.connections.upsert({
                    where: {
                        id: String(req.query.t_id),
                    },
                    update: {
                        tp_access_token: result.data?.access_token,
                        tp_refresh_token: result.data?.refresh_token,
                        app_client_id: clientId || config.SLACK_CLIENT_ID,
                        app_client_secret: clientSecret || config.SLACK_CLIENT_SECRET,
                    },
                    create: {
                        id: String(req.query.t_id),
                        t_id: req.query.t_id as string,
                        tp_id: integrationId,
                        tp_access_token: String(result.data?.access_token),
                        tp_refresh_token: String(result.data?.refresh_token),
                        app_client_id: clientId || config.SLACK_CLIENT_ID,
                        app_client_secret: clientSecret || config.SLACK_CLIENT_SECRET,
                        tp_customer_id: String(info.data.user?.id),
                        owner_account_public_token: revertPublicKey,
                        appId: account?.apps[0].id,
                    },
                });
                // Svix stuff goes here ****
                config.svix?.message.create(svixAppId, {
                    eventType: 'connection.added',
                    payload: {
                        eventType: 'connection.added',
                        connection: {
                            t_id: req.query.t_id as string,
                            tp_id: TP_ID.slack,
                            tp_access_token: String(result.data?.access_token),
                            tp_customer_id: String(info.data.user?.id),
                        },
                    },
                    channels: [req.query.t_id as string],
                });

                await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${req.query.t_id}`, {
                    publicToken: revertPublicKey,
                    status: 'SUCCESS',
                    integrationName: mapIntegrationIdToIntegrationName[integrationId],
                    tenantId: req.query.t_id,
                    tenantSecretToken,
                } as IntegrationStatusSseMessage);

                res.send({ status: 'ok', tp_customer_id: info.data.user });
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
        } else if (integrationId === TP_ID.discord && req.query.code && req.query.t_id && revertPublicKey) {
            const formData = {
                client_id: clientId || config.DISCORD_CLIENT_ID,
                client_secret: clientSecret || config.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: req.query.code,
                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/discord`,
            };

            const result = await axios.post('https://discord.com/api/oauth2/token', qs.stringify(formData));

            logInfo('OAuth creds for discord', result.data);

            const info = await axios.get('https://discord.com/api/users/@me', {
                headers: {
                    authorization: `${result.data.token_type} ${result.data.access_token}`,
                },
            });
            logInfo('OAuth token info', info.data);
            const guildId = result.data?.guild?.id;
            try {
                await xprisma.connections.upsert({
                    where: {
                        id: String(req.query.t_id),
                    },
                    update: {
                        tp_access_token: result.data?.access_token,
                        tp_refresh_token: result.data?.refresh_token,
                        app_client_id: clientId || config.DISCORD_CLIENT_ID,
                        app_client_secret: clientSecret || config.DISCORD_CLIENT_SECRET,
                        app_bot_token: botToken || config.DISCORD_BOT_TOKEN,
                    },
                    create: {
                        id: String(req.query.t_id),
                        t_id: req.query.t_id as string,
                        tp_id: integrationId,
                        tp_access_token: String(result.data?.access_token),
                        tp_refresh_token: String(result.data?.refresh_token),
                        app_client_id: clientId || config.DISCORD_CLIENT_ID,
                        app_client_secret: clientSecret || config.DISCORD_CLIENT_SECRET,
                        app_bot_token: botToken || config.DISCORD_BOT_TOKEN,
                        tp_customer_id: guildId,
                        owner_account_public_token: revertPublicKey,
                        appId: account?.apps[0].id,
                    },
                });

                config.svix?.message.create(svixAppId, {
                    eventType: 'connection.added',
                    payload: {
                        eventType: 'connection.added',
                        connection: {
                            t_id: req.query.t_id as string,
                            tp_id: TP_ID.discord,
                            tp_access_token: result.data.access_token,
                            tp_customer_id: guildId,
                        },
                    },
                    channels: [req.query.t_id as string],
                });
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
        } else if (integrationId === TP_ID.msteams && req.query.code && revertPublicKey) {
            const formData = {
                client_id: clientId || config.MSTEAMS_CLIENT_ID,
                client_secret: clientSecret || config.MSTEAMS_CLIENT_SECRET,
                scope: String(req.query.scopes).split(',').join(' '),
                code: req.query.code,
                redirect_uri: 'http://localhost:3000/oauth-callback/msteams',
                grant_type: 'authorization_code',
            };

            const result: any = await axios({
                method: 'post',
                url: `https://login.microsoftonline.com/${'common'}/oauth2/v2.0/token`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: formData,
            });

            logInfo('OAuth creds for Microsoft Teams', result.data);

            const info: any = await axios({
                method: 'get',
                url: `https://graph.microsoft.com/v1.0/me`,
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
                        app_client_id: clientId || config.MSTEAMS_CLIENT_ID,
                        app_client_secret: clientSecret || config.MSTEAMS_CLIENT_SECRET,
                    },
                    create: {
                        id: String(req.query.t_id),
                        t_id: req.query.t_id as string,
                        tp_id: integrationId,
                        tp_access_token: String(result.data?.access_token),
                        tp_refresh_token: String(result.data?.refresh_token),
                        app_client_id: clientId || config.MSTEAMS_CLIENT_ID,
                        app_client_secret: clientSecret || config.MSTEAMS_CLIENT_SECRET,
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
                            tp_id: TP_ID.msteams,
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
            await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${req.query.t_id}`, {
                publicToken: revertPublicKey,
                status: 'FAILED',
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tenantId: req.query.t_id,
                tenantSecretToken,
            } as IntegrationStatusSseMessage);
            res.send({
                status: 'noop',
            });
        }
    } catch (error: any) {
        logError(error);
        logInfo('Error while getting oauth creds', error);
    }
});

authRouter.get('/oauth/refresh', async (_, res) => {
    res.status(200).send(await AuthService.refreshOAuthTokensForThirdPartyChatServices());
});

export default authRouter;
