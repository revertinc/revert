import express from 'express';
import config from '../../../config';
import prisma, { xprisma } from '../../../prisma/client';
import logError from '../../../helpers/logError';
import { TP_ID } from '@prisma/client';

import { WebClient } from '@slack/web-api';
import AuthService from '../../../services/auth';

const authRouter = express.Router();

/**
 * OAuth API
 */

// Below route is a quick test endpoint as client package was not working in my case
authRouter.get('/chat-login', async (_, res) => {
    const slackButton = `<a href="https://slack.com/oauth/v2/authorize?client_id=5867207742087.5887133932997&scope=channels:read,groups:read,im:read,mpim:read,users:read,chat:write&user_scope=identity.basic,identity.email"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>`;

    res.status(200).header('Content-Type', 'text/html; charset=utf-8').send(slackButton);
});

authRouter.get('/oauth-callback', async (req, res) => {
    const slackClient = new WebClient();

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

        if (integrationId === TP_ID.slack && req.query.code && req.query.t_id && revertPublicKey) {
            // handling the slack received code

            const result = await slackClient.oauth.v2.access({
                client_id: config.SLACK_CLIENT_ID,
                client_secret: config.SLACK_CLIENT_SECRET,
                code: String(req.query.code),
                grant_type: 'authorization_code',
            });

            console.log('OAuth creds for slack', result);

            const info = await slackClient.users.info({
                token: result.access_token,
                user: String(result.authed_user?.id),
            });

            console.log('OAuth token info', info);

            try {
                await xprisma.connections.upsert({
                    where: {
                        id: String(req.query.t_id),
                    },
                    update: {
                        tp_access_token: result.authed_user?.access_token,
                        tp_refresh_token: result.authed_user?.refresh_token,
                        app_client_id: clientId || config.SLACK_CLIENT_ID,
                        app_client_secret: clientSecret || config.SLACK_CLIENT_SECRET,
                    },
                    create: {
                        id: String(req.query.t_id),
                        t_id: req.query.t_id as string,
                        tp_id: integrationId,
                        tp_access_token: String(result.authed_user?.access_token),
                        tp_refresh_token: String(result.authed_user?.refresh_token),
                        app_client_id: clientId || config.SLACK_CLIENT_ID,
                        app_client_secret: clientSecret || config.SLACK_CLIENT_SECRET, // TODO: Fix in other platforms.
                        tp_customer_id: String(info.user?.id),
                        owner_account_public_token: revertPublicKey,
                        appId: account?.apps[0].id,
                    },
                });
                // Svix stuff goes here ****

                res.send({ status: 'ok', tp_customer_id: info.user?.id });
            } catch (error: any) {
                logError(error);

                res.send({ status: 'error', error: error });
            }
        }
        res.status(200).json({ msg: 'yo', account });
    } catch (error: any) {}
});

authRouter.get('/oauth/refresh', async (_, res) => {
    res.status(200).send(await AuthService.refreshOAuthTokensForThirdParty());
});

export default authRouter;
