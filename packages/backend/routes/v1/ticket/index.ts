import express from 'express';
import { createSession } from 'better-sse';
import authRouter from './auth';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../../redis/client/pubsub';
import { logDebug, logError } from '../../../helpers/logger';
import { OAuth } from 'oauth';
import config from '../../../config';
import redis from '../../../redis/client';
import prisma from '../../../prisma/client';

const ticketRouter = express.Router();

ticketRouter.get('/ping', async (_, res) => {
    res.send({
        status: 'ok',
        message: 'PONG',
    });
});

ticketRouter.use('/', authRouter);

ticketRouter.get('/integration-status/:publicToken', async (req, res) => {
    try {
        const publicToken = req.params.publicToken;
        const { tenantId } = req.query;
        const session = await createSession(req, res);
        await pubsub.subscribe(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${tenantId}`, async (message: any) => {
            logDebug('pubsub message', message);
            let parsedMessage = JSON.parse(message) as IntegrationStatusSseMessage;
            if (parsedMessage.publicToken === publicToken) {
                session.push(JSON.stringify(parsedMessage));
            }
        });
    } catch (err: any) {
        logError(err);
    }
});

ticketRouter.get('/trello-request-token', async (req, res) => {
    const requestURL = 'https://trello.com/1/OAuthGetRequestToken';
    const accessURL = 'https://trello.com/1/OAuthGetAccessToken';
    const authorizeURL = 'https://trello.com/1/OAuthAuthorizeToken';
    const expiration = '1hour';
    const { tenantId, revertPublicToken } = req.query;
    const loginCallback = `${config.OAUTH_REDIRECT_BASE}/trello?tenantId=${tenantId}&revertPublicToken=${revertPublicToken}`;
    const account = await prisma.environments.findFirst({
        where: {
            public_token: String(revertPublicToken),
        },
        include: {
            apps: {
                select: { id: true, app_client_id: true, app_client_secret: true, is_revert_app: true },
                where: { tp_id: 'trello' },
            },
            accounts: true,
        },
    });

    const clientId = account?.apps[0]?.is_revert_app ? undefined : account?.apps[0]?.app_client_id;
    const clientSecret = account?.apps[0]?.is_revert_app ? undefined : account?.apps[0]?.app_client_secret;
    const oauth = new OAuth(
        requestURL,
        accessURL,
        String(clientId),
        String(clientSecret),
        '1.0A',
        loginCallback,
        'HMAC-SHA1'
    );

    const oauth_creds: any = {};
    oauth.getOAuthRequestToken(async (_error, token, tokenSecret, _results) => {
        //@TODO Error handling
        oauth_creds['oauth_token'] = token;
        oauth_creds['oauth_secret'] = tokenSecret;
        await redis.setEx(`trello_dev_oauth_token_${oauth_creds.oauth_token}`, 3600, oauth_creds.oauth_secret);
        res.send({ status: 'ok', oauth_token: oauth_creds.oauth_token, expiration, authorizeURL });
    });
});

export default ticketRouter;
