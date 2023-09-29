import express from 'express';
import authRouter from './auth';

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

export default chatRouter;
