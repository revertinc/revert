import express from 'express';
import authRouter from './auth';

const discordChatRouter = express.Router();

/**
 * Test PING
 */

discordChatRouter.get('/ping', async (_, res) => {
    res.send({
        status: 'ok',
        message: 'PONG',
    });
});

discordChatRouter.use('/', authRouter);

export default discordChatRouter;