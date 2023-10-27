import express from 'express';
import config from '../../../config';
import prisma, { xprisma } from '../../../prisma/client';
import logError from '../../../helpers/logger';
import { TP_ID } from '@prisma/client';
import AuthService from '../../../services/auth';
import axios from 'axios';
// import qs from 'qs';
// import Discord from 'discord.js';

const authRouter = express.Router();
// const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS]})

/**
 * OAuth API
 */

// Below route is a quick test endpoint as client package was not working in my case
authRouter.get('/discord-login', async (_, res) => {

   
      
      // Replace 'YOUR_BOT_TOKEN' with your bot's token
      
    const discordButton = `<a href="https://discord.com/api/oauth2/authorize?client_id=1163776179002683402&permissions=274895748096&redirect_uri=https%3A%2F%2Flocalhost%3A4001%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify%20bot" /></a>`;

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

        
        if (integrationId === TP_ID.discord && req.query.code && req.query.t_id && revertPublicKey) {
            // handling the discord received code

           
            const url = 'https://discord.com/api/oauth2/token';
            
            
            try {
                const formData = new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id:  config.DISCORD_CLIENT_ID,
                    client_secret:  config.DISCORD_CLIENT_SECRET,
                    redirect_uri: `https://localhost:4001/auth/discord/callback`,
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
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: `${result.data?.token_type} ${result.data?.access_token}`,
                    },
                    // params: {
                    //     user: result.data.guild.id,
                    // },
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
                        app_client_id:   config.DISCORD_CLIENT_ID,
                        app_client_secret:   config.DISCORD_CLIENT_SECRET,
                    },
                    create: {
                        id:  String(req.query.t_id),
                        t_id:  req.query.t_id as string,
                        tp_id: integrationId,
                        tp_access_token: String(result.data?.access_token),
                        tp_refresh_token: String(result.data?.refresh_token),
                        app_client_id:   config.DISCORD_CLIENT_ID,
                        app_client_secret:    config.DISCORD_CLIENT_SECRET,
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
                console.log(error,"error hain bhai")
            }
            // const info = await slackClient.users.info({
            //     token: result.access_token,
            //     user: String(result.authed_user?.id),
            // });
            // const infoData = {
            //     token: result.data.access_token,
            //     user: result.data.authed_user.id,
            // };
           
           
        }else{
            console.log("first")
        }
        res.status(200).json({ msg: 'yo', account });
    } catch (error: any) {}
});

authRouter.get('/oauth/refresh', async (_, res) => {
    res.status(200).send(await AuthService.refreshOAuthTokensForThirdPartyChatServices());
});

export default authRouter;