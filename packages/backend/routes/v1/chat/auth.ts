import express from 'express';
import config from '../../../config';
import prisma, { xprisma } from '../../../prisma/client';
import logError, { logInfo } from '../../../helpers/logError';
import { Prisma, TP_ID } from '@prisma/client';
import AuthService from '../../../services/auth';
import axios from 'axios';
import qs from 'qs';

const authRouter = express.Router();

/**
 * OAuth API
 */
authRouter.get('/oauth-callback', async (req, res) => {
    logInfo('OAuth callback', req.query);
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
            const url = 'https://slack.com/api/oauth.v2.access';
            const formData = {
                grant_type: 'authorization_code',
                client_id: clientId || config.SLACK_CLIENT_ID,
                client_secret: clientSecret || config.SLACK_CLIENT_SECRET,
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

                res.send({ status: 'ok', tp_customer_id: info.data.user?.id });
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
                res.send({ status: 'error', error: error });
            }
        } else {
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
