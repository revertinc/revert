import express from 'express';
import contactRouter from './contact';
import companyRouter from './company';
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
crmRouter.use('/contacts', contactRouter);
crmRouter.use('/companies', companyRouter);
crmRouter.use('/tasks', taskRouter);
crmRouter.use('/events', eventRouter);
crmRouter.use('/users', userRouter);
crmRouter.use('/proxy', proxyRouter);

export default crmRouter;
