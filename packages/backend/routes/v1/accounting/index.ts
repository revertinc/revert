import express from 'express';
import authRouter from './auth';

const accountingRouter = express.Router();

accountingRouter.get('/ping', async (_, res) => {
    res.send({
        status: 'ok',
        message: 'PONG',
    });
});

accountingRouter.use('/', authRouter);

export default accountingRouter;
