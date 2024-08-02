import prisma from '../prisma/client';
import axios from 'axios';
import express from 'express';
import cors from 'cors';

import { createSession } from 'better-sse';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../redis/client/pubsub';
import { logDebug } from '../helpers/logger';

import crmRouter from './v1/crm';
import config from '../config';
import revertAuthMiddleware from '../helpers/authMiddleware';
import rateLimitMiddleware from '../helpers/rateLimitMiddleware';
import { register } from '../generated/typescript';
import { metadataService } from '../services/metadata';
import { accountService } from '../services/Internal/account';

import AuthService from '../services/auth';
import { logError } from '../helpers/logger';
import verifyRevertWebhook from '../helpers/verifyRevertWebhook';
import {
    companyService,
    contactService,
    dealService,
    eventService,
    leadService,
    noteService,
    proxyService,
    taskService,
    userService,
} from '../services/crm';
import { connectionService } from '../services/connection';
import { fieldMappingService } from './v1/fieldMapping';
import { propertiesService } from './properties';
import chatRouter from './v1/chat';
import { usersService } from '../services/chat/users';
import { channelsService } from '../services/chat/channels';
import { messageService } from '../services/chat/message';
import { telemetryService } from '../services/Internal/telemetry';
import { analyticsService } from '../services/Internal/analytics';
import ticketRouter from './v1/ticket';
import { taskServiceTicket } from '../services/ticket/task';
import { userServiceTicket } from '../services/ticket/user';
import { collectionServiceTicket } from '../services/ticket/collection';
import { commentServiceTicket } from '../services/ticket/comment';
import { proxyServiceTicket } from '../services/ticket/proxy';
import { syncService } from '../services/sync';

import accountingRouter from './v1/accounting';
import { vendorServiceAccounting } from '../services/accounting/vendor';
import { expenseServiceAccounting } from '../services/accounting/expense';
import { accountServiceAccounting } from '../services/accounting/account';
import { proxyServiceAccounting } from '../services/accounting/proxy';

import atsRouter from './v1/ats';
import { departmentServiceAts } from '../services/ats/department';
import { candidateServiceAts } from '../services/ats/candidate';
import { offerServiceAts } from '../services/ats/offer';
import { jobServiceAts } from '../services/ats/job';
import { proxyServiceAts } from '../services/ats/proxy';

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

router.post('/debug-svix', (req, res) => {
    try {
        const secret = config.SVIX_ENDPOINT_SECRET;
        const verified = verifyRevertWebhook(req, secret);
        console.log('verified', verified, req.body);
        if (verified) {
            res.json({ status: 'Verified!' });
        } else {
            res.json({ error: 'Not verified' });
        }
        // Do something with the message...
    } catch (err) {
        console.error('Unverified webhook', err);
        res.status(400).json({ error: 'Unverified webhook' });
    }
});

router.post('/slack-alert', async (req, res) => {
    try {
        const email = req.body.email;
        const name = req.body.name;
        const message = req.body.message;
        await axios({
            method: 'post',
            url: config.SLACK_URL,
            data: JSON.stringify({
                text: `Woot! :zap: ${name} @ ${email} signed up for Revert!\n\n*Additional message*: \n\n ${message}`,
            }),
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
    } catch (error: any) {
        logError(error);
        res.send({
            status: 'error',
            error: error,
        });
    }
});

router.post('/clerk/webhook', async (req, res) => {
    if (req.body) {
        let webhookData = req.body.data;
        let webhookEventType = req.body.type;
        res.status(200).send(await AuthService.createAccountOnClerkUserCreation(webhookData, webhookEventType));
    }
});

router.get('/connection/integration-status/:publicToken', async (req, res) => {
    try {
        const publicToken = req.params.publicToken;
        const { tenantId } = req.query;
        const session = await createSession(req, res);
        await pubsub.subscribe(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${tenantId}`, async (message: any) => {
            logDebug('pubsub message', message);
            let parsedMessage = JSON.parse(message) as IntegrationStatusSseMessage;
            if (parsedMessage.publicToken === publicToken) {
                session.push(JSON.stringify(parsedMessage));
            }
        });
    } catch (err: any) {
        logError(err);
    }
});

router.use('/crm', cors(), [revertAuthMiddleware(), rateLimitMiddleware()], crmRouter);

router.use('/chat', cors(), [revertAuthMiddleware(), rateLimitMiddleware()], chatRouter);

router.use('/ticket', cors(), [revertAuthMiddleware(), rateLimitMiddleware()], ticketRouter);

router.use('/accounting', cors(), [revertAuthMiddleware(), rateLimitMiddleware()], accountingRouter);

router.use('/ats', cors(), [revertAuthMiddleware(), rateLimitMiddleware()], atsRouter);

register(router, {
    metadata: metadataService,
    internal: {
        account: accountService,
        telemetry: telemetryService,
        analytics: analyticsService,
    },
    crm: {
        lead: leadService,
        deal: dealService,
        note: noteService,
        company: companyService,
        contact: contactService,
        event: eventService,
        task: taskService,
        user: userService,
        proxy: proxyService,
        properties: propertiesService,
    },
    fieldMapping: fieldMappingService,
    connection: connectionService,
    chat: {
        users: usersService,
        channels: channelsService,
        messages: messageService,
    },
    ticket: {
        task: taskServiceTicket,
        user: userServiceTicket,
        comment: commentServiceTicket,
        collection: collectionServiceTicket,
        proxy: proxyServiceTicket,
    },

    accounting: {
        account: accountServiceAccounting,
        expense: expenseServiceAccounting,
        vendor: vendorServiceAccounting,
        proxy: proxyServiceAccounting,
    },

    ats: {
        department: departmentServiceAts,
        candidate: candidateServiceAts,
        offer: offerServiceAts,
        job: jobServiceAts,
        proxy: proxyServiceAts,
    },
    sync: syncService,
});

export default router;
