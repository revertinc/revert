import express from 'express';
import config from '../../../config';
import prisma, { xprisma } from '../../../prisma/client';
import logError from '../../../helpers/logger';
import { TP_ID } from '@prisma/client';
import AuthService from '../../../services/auth';
import axios from 'axios';
import qs from 'qs';

const authRouter = express.Router();

/**
 * OAuth API
 */

// Below route is a quick test endpoint as client package was not working in my case
authRouter.get('/chat-login', async (_, res) => {
    const discordButton = `<a href="https://discord.com/api/oauth2/authorize?client_id=1157214267544702986&redirect_uri=http%3A%2F%2Flocalhost%3A4001&response_type=code&scope=identify 2x" /></a>`;

    res.status(200).header('Content-Type', 'text/html; charset=utf-8').send(discordButton);
});

authRouter.get('/oauth-callback', async (req, res) => {
    const integrationId = req.query.integrationId as TP_ID; // add TP_ID alias after
    const revertPublicKey = req.query.x_revert_public_token as string;

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
        // const svixAppId = account!.accounts!.id;

        if (integrationId === TP_ID.discord && req.query.code && req.query.t_id && revertPublicKey) {
            const url = 'https://discord.com/api/v1/users/@me';
            const formData = {
                grant_type: 'authorization_code',
                client_id: clientId || config.DISCORD_CLIENT_ID,
                client_secret: clientSecret || config.DISCORD_CLIENT_SECRET,
                code: req.query.code,
            };
            const result = await axios({
                method: 'post',
                url: url,
                data: qs.stringify(formData),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            console.log('OAuth creds for discord', result.data);

            
            const info = await axios({
                method: 'get',
                url: 'https://discord.com/api/v1/guilds/:guild-id/channels',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Bearer ${result.data.access_token}`,
                },
                params: {
                    user: result.data.authed_user.id,
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
                        app_client_id: clientId || config.DISCORD_CLIENT_ID,
                        app_client_secret: clientSecret || config.DISCORD_CLIENT_SECRET,
                    },
                    create: {
                        id: String(req.query.t_id),
                        t_id: req.query.t_id as string,
                        tp_id: integrationId,
                        tp_access_token: String(result.data?.access_token),
                        tp_refresh_token: String(result.data?.refresh_token),
                        app_client_id: clientId || config.DISCORD_CLIENT_ID,
                        app_client_secret: clientSecret || config.DISCORD_CLIENT_SECRET,
                        tp_customer_id: String(info.data.user?.id),
                        owner_account_public_token: revertPublicKey,
                        appId: account?.apps[0].id,
                    },
                });
                // Svix stuff goes here ****

                res.send({ status: 'ok', tp_customer_id: info.data.user?.id });
            } catch (error: any) {
                logError(error);

                res.send({ status: 'error', error: error });
            }
        }
        res.status(200).json({ msg: 'yo', account });
    } catch (error: any) {}
});

authRouter.get('/oauth/refresh', async (_, res) => {
    res.status(200).send(await AuthService.refreshOAuthTokensForThirdPartyChatServices());
});

export default authRouter;