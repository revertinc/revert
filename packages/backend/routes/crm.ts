import express from 'express';
import leadRouter from './crm/lead';
import contactRouter from './crm/contact';
import companyRouter from './crm/company';
import proxyRouter from './crm/proxy';
import authRouter from './crm/auth';
import noteRouter from './crm/note';

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
crmRouter.use('/leads', leadRouter);
crmRouter.use('/contacts', contactRouter);
crmRouter.use('/companies', companyRouter);
crmRouter.use('/notes', noteRouter);
crmRouter.use('/proxy', proxyRouter);

export default crmRouter;
