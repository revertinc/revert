import express from 'express';
import proxyRouter from './proxy';
import authRouter from './auth';
import taskRouter from './task';
import eventRouter from './event';
import userRouter from './user';

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
crmRouter.use('/tasks', taskRouter);
crmRouter.use('/events', eventRouter);
crmRouter.use('/users', userRouter);
crmRouter.use('/proxy', proxyRouter);

export default crmRouter;
