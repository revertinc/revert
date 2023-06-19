import prisma from '../prisma/client';
import axios from 'axios';
import express, { Request, Response } from 'express';
import cors from 'cors';

import crmRouter from './v1/crm';
import config from '../config';
import revertAuthMiddleware from '../helpers/authMiddleware';
import { manageRouterVersioning } from '../helpers/versionMiddleware';
import connectionRouter from './v1/connection';
import metadataRouter from './v1/metadata';

const router = express.Router();

router.get('/health-check', (_, response) => {
    response.send({
        status: 'ok',
    });
});

router.get('/', (_, response) => {
    response.send({
        status: 'nothing to see here.',
    });
});

router.get('/debug-sentry', () => {
    throw new Error('My first Sentry error!');
});

router.post('/slack-alert', async (req, res) => {
    try {
        const email = req.body.email;
        await axios({
            method: 'post',
            url: config.SLACK_URL,
            data: JSON.stringify({ text: `Woot! :zap: ${email} signed up for Revert!` }),
        });
        await prisma.waitlist.upsert({
            where: {
                email: email,
            },
            update: {
                email: email,
            },
            create: {
                email: email,
            },
        });
        res.send({
            status: 'ok',
        });
    } catch (error) {
        res.send({
            status: 'error',
            error: error,
        });
    }
});

// TODO: Just to test versions. Remove later
const testv2Router = (_req: Request, res: Response) => {
    res.send({ data: 'v2 hit' });
};

router.use(
    '/crm',
    cors(),
    revertAuthMiddleware(),
    manageRouterVersioning({
        'v1': crmRouter,
        'v2': testv2Router,
    })
);
router.use('/connection', cors(), revertAuthMiddleware(), manageRouterVersioning({
    'v1': connectionRouter,
    'v2': testv2Router,
}));
router.use('/metadata', cors(), manageRouterVersioning({
    'v1': metadataRouter,
    'v2': testv2Router,
}));

export default router;
