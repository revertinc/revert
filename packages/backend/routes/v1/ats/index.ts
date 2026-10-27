import express from 'express';
import prisma from '../../../prisma/client';

import authRouter from './auth';
import { logError } from '../../../helpers/logger';
import { InternalServerError } from '../../../generated/typescript/api/resources/common';
import { AppConfig } from '../../../constants/common';
import config from '../../../config';
import { parseWorkdayTenantUrl, workdayEnv } from '../../../helpers/ats/workday';

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

atsRouter.get('/workday-app_config', async (req, res) => {
    try {
        const { revertPublicToken } = req.query;
        const environment = await prisma.environments.findFirst({
            where: { public_token: String(revertPublicToken) },
            include: {
                apps: {
                    select: { app_config: true },
                    where: { tp_id: 'workday' },
                },
            },
        });
        const appConfig = environment?.apps[0]?.app_config as AppConfig | undefined;
        let orgUrl = appConfig?.org_url || config.WORKDAY_API_BASE_URL || '';
        if (orgUrl && config.WORKDAY_TENANT) {
            const parsed = new URL(orgUrl);
            if (!parsed.pathname || parsed.pathname === '/') {
                orgUrl = parsed.origin + '/' + config.WORKDAY_TENANT;
            }
        }
        const endpoints = parseWorkdayTenantUrl(orgUrl, workdayEnv(config));
        if (!endpoints.authorizeUrl) {
            return res.status(400).send({ status: 'error', error: 'Workday tenant URL is not configured' });
        }
        return res.send({
            status: 'ok',
            org_url: orgUrl,
            authorizeUrl: endpoints.authorizeUrl,
        });
    } catch (error: any) {
        logError(error);
        return res.status(400).send({ status: 'error', error: 'Invalid Workday organisation URL' });
    }
});

atsRouter.use('/', authRouter);

export default atsRouter;
