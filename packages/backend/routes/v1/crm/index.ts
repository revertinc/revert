import express from 'express';
import { createSession } from 'better-sse';
import authRouter from './auth';
import pubsub, { PUBSUB_CHANNELS } from '../../../helpers/pubsub';
import logger from '../../../helpers/logger';

const crmRouter = express.Router();

/**
 * Test PING
 */

crmRouter.get('/ping', async (_, res) => {
    // await pubsub.publish(PUBSUB_CHANNELS.INTEGRATION_STATUS, { message: 'ping sent', publicToken: 'localPublicToken' });
    res.send({
        status: 'ok',
        message: 'PONG',
    });
});

crmRouter.use('/', authRouter);

crmRouter.get('/integration-status/:publicToken', async (req, res) => {
    const publicToken = req.params.publicToken;
    const session = await createSession(req, res);
    await pubsub.subscribe(PUBSUB_CHANNELS.INTEGRATION_STATUS, (message: any) => {
        logger.debug('pubsub message', message);
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.publicToken === publicToken) {
            session.push(message);
        }
    });
});

export default crmRouter;
