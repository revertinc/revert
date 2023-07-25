import express from 'express';
import proxyRouter from './proxy';
import authRouter from './auth';

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
crmRouter.use('/proxy', proxyRouter);

export default crmRouter;
