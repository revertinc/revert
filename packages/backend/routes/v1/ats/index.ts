import express from 'express';
import prisma from '../../../prisma/client';

import authRouter from './auth';
import { logError } from '../../../helpers/logger';
import { InternalServerError } from '../../../generated/typescript/api/resources/common';
import { AppConfig } from '../../../constants/common';

const atsRouter = express.Router();

atsRouter.get('/ping', async (_, res) => {
    res.send({
        status: 'ok',
        message: 'PONG',
    });
});

atsRouter.get('/lever-app_config', async (req, res) => {
    try {
        const { revertPublicToken } = req.query;

        const app = await prisma.environments.findFirst({
            where: {
                public_token: String(revertPublicToken),
            },
            include: {
                apps: {
                    select: { app_config: true },
                    where: { tp_id: 'lever' },
                },
            },
        });

        const appConfig = app && (app.apps[0].app_config as AppConfig);

        if (appConfig?.env === 'Production') {
            return res.send({ status: 'ok', env: 'Production' });
        }

        return res.send({ status: 'ok', env: 'Sandbox' });
    } catch (error: any) {
        logError(error);
        throw new InternalServerError({
            error: 'Internal Server error',
        });
    }
});

atsRouter.use('/', authRouter);

export default atsRouter;
