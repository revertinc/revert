import express from 'express';
import { createSession } from 'better-sse';
import authRouter from './auth';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../../helpers/pubsub';
import logger from '../../../helpers/logger';
import logError from '../../../helpers/logError';

const crmRouter = express.Router();

/**
 * Test PING
 */

crmRouter.get('/ping', async (_, res) => {
    res.send({
        status: 'ok',
        message: 'PONG',
    });
});

crmRouter.use('/', authRouter);

crmRouter.get('/integration-status/:publicToken', async (req, res) => {
    try {
        const publicToken = req.params.publicToken;
        const session = await createSession(req, res);
        await pubsub.subscribe(PUBSUB_CHANNELS.INTEGRATION_STATUS, (message: any) => {
            logger.debug('pubsub message', message);
            const parsedMessage = JSON.parse(message) as IntegrationStatusSseMessage;
            if (parsedMessage.publicToken === publicToken) {
                session.push(message);
            }
        });
    } catch (err: any) {
        logError(err);
    }
});

export default crmRouter;
