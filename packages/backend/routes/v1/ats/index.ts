import express from 'express';
import authRouter from './auth';

const atsRouter = express.Router();

atsRouter.get('/ping', async (_, res) => {
    res.send({
        status: 'ok',
        message: 'PONG',
    });
});

atsRouter.use('/', authRouter);

export default atsRouter;
