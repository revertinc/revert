import express from 'express';
import { createSession } from 'better-sse';
import authRouter from './auth';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../../redis/client/pubsub';
import { logDebug, logError } from '../../../helpers/logger';

const chatRouter = express.Router();

/**
 * Test PING
 */

chatRouter.get('/ping', async (_, res) => {
    res.send({
        status: 'ok',
        message: 'PONG',
    });
});

chatRouter.use('/', authRouter);

chatRouter.get('/integration-status/:publicToken', async (req, res) => {
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

export default chatRouter;
