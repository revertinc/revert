import express from 'express';
import config from '../../../config';
import prisma, { xprisma } from '../../../prisma/client';
import { logError, logInfo, logDebug } from '../../../helpers/logger';
import { Prisma, TP_ID } from '@prisma/client';
import AuthService from '../../../services/auth';
import axios from 'axios';
import qs from 'qs';
import { randomUUID } from 'crypto';
import redis from '../../../redis/client';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../../redis/client/pubsub';
import { mapIntegrationIdToIntegrationName } from '../../../constants/common';

const authRouter = express.Router();

/**
 * OAuth API
 */

// Below route is a quick test endpoint as client package was not working in my case
authRouter.get('/discord-login', async (_, res) => {



    // Replace 'YOUR_BOT_TOKEN' with your bot's token

  const discordButton = `<a href="https://discord.com/api/oauth2/authorize?client_id=1163776179002683402&permissions=8&redirect_uri=http%3A%2F%2Flocalhost%3A4001%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify%20messages.read%20applications.commands%20bot" /></a>`;

  res.status(200).header('Content-Type', 'text/html; charset=utf-8').send(discordButton);
});

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
                    select: { id: true, app_client_id: true, app_client_secret: true,app_bot_token: true, is_revert_app: true },
                    where: { tp_id: integrationId },
                },
                accounts: true,
            },
        });

        const clientId = account?.apps[0]?.is_revert_app ? undefined : account?.apps[0]?.app_client_id;
        const clientSecret = account?.apps[0]?.is_revert_app ? undefined : account?.apps[0]?.app_client_secret;
        const svixAppId = account!.accounts!.id;
        const botToken = account?.apps[0]?.is_revert_app ? undefined : account?.apps[0].app_bot_token;
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
                            tp_id: TP_ID.sfdc,
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
        } 
        
        if (integrationId === TP_ID.discord && req.query.code && req.query.t_id && revertPublicKey) {
            // handling the discord received code


            const url = 'https://discord.com/api/oauth2/token';


            try {
                const formData = new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: clientId || config.DISCORD_CLIENT_ID,
                    client_secret: clientSecret || config.DISCORD_CLIENT_SECRET,
                    redirect_uri: `http://localhost:4001/auth/discord/callback`,
                    code: req.query.code as string,
                    scope: "identify"
                });

                const result = await axios({
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    url: url,
                    data: formData,
                });

                console.log('OAuth creds for discord', result.data);
                console.log(result.data?.refresh_token, "result.data?.refresh_token")
                const info = await axios({
                    method: 'get',
                    url: 'https://discord.com/api/users/@me',
                    headers: {
                        Authorization: `${result.data?.token_type} ${result.data?.access_token}`,
                    },

                });

                console.log('OAuth token info', info.data);

     try {
                await xprisma.connections.upsert({
                    where: {
                        id: String(req.query.t_id),
                    },
                    update: {
                        tp_access_token: result.data?.access_token,
                        tp_refresh_token: result.data?.refresh_token,
                        app_client_id: clientId ||  config.DISCORD_CLIENT_ID,
                        app_client_secret: clientSecret ||  config.DISCORD_CLIENT_SECRET,
                        app_bot_token: botToken ||  config.DISCORD_BOT_TOKEN,
                    },
                    create: {
                        id:  String(req.query.t_id),
                        t_id:  req.query.t_id as string,
                        tp_id: integrationId,
                        tp_access_token: String(result.data?.access_token),
                        tp_refresh_token: String(result.data?.refresh_token),
                        app_client_id:  clientId || config.DISCORD_CLIENT_ID,
                        app_client_secret: clientSecret ||    config.DISCORD_CLIENT_SECRET,
                        app_bot_token: botToken ||    config.DISCORD_BOT_TOKEN,
                        tp_customer_id: String(info.data.user?.id),
                        owner_account_public_token: revertPublicKey,
                        appId: account?.apps[0].id,
                    },
                });
                // Svix stuff goes here ****

                res.send({ status: 'ok', tp_customer_id: info.data.user?.id});
            } catch (error: any) {
                logError(error);

                res.send({ status: 'error', error: error });
            }
            } catch (error) {
                console.log(error)
            }



        } else {
            res.send({
                status: 'noop',
            });
        }
        res.status(200).json({ msg: 'yo', account });
    } catch (error: any) {
        logError(error);
        logInfo('Error while getting oauth creds', error);
    }
});

authRouter.get('/oauth/refresh', async (_, res) => {
    res.status(200).send(await AuthService.refreshOAuthTokensForThirdPartyChatServices());
});

export default authRouter;