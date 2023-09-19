import express from 'express';
import { createSession } from 'better-sse';
import authRouter from './auth';
import { getObjectPropertiesForConnection } from '../../../services/crm/properties';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../../helpers/pubsub';
import logger from '../../../helpers/logger';
import logError from '../../../helpers/logError';
import { isStandardError } from '../../../helpers/error';
import revertTenantMiddleware from '../../../helpers/tenantIdMiddleware';
import { InternalServerError } from '../../../generated/typescript/api/resources/common';

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

crmRouter.get('/integration-status/:publicToken', async (req, res) => {
    try {
        const publicToken = req.params.publicToken;
        const session = await createSession(req, res);
        await pubsub.subscribe(PUBSUB_CHANNELS.INTEGRATION_STATUS, (message: any) => {
            logger.debug('pubsub message', message);
            const parsedMessage = JSON.parse(message) as IntegrationStatusSseMessage;
            if (parsedMessage.publicToken === publicToken) {
                session.push(message);
            }
        });
    } catch (err: any) {
        logError(err);
    }
});

crmRouter.get('/field-mapping', revertTenantMiddleware(), async (_req, res) => {
    const { account, connection } = res.locals;
    const { accountFieldMappingConfig } = account;
    const {
        allow_connection_override_custom_fields: canAddCustomMapping,
        mappable_by_connection_field_list: mappableFields,
    } = accountFieldMappingConfig || {};

    const objects = mappableFields.map((f: any) => f.objectName);
    const fieldList: Record<string, any> = {};
    await Promise.all(
        objects.map(async (obj: string) => {
            fieldList[obj] = await getObjectPropertiesForConnection({ objectName: obj, connection });
        })
    );

    res.status(200).send({
        canAddCustomMapping,
        mappableFields,
        fieldList,
    });
});

crmRouter.get('/:objectName/properties', revertTenantMiddleware(), async (req, res) => {
    const { connection } = res.locals;
    const objectName = req.params.objectName;

    try {
        const result = await getObjectPropertiesForConnection({ objectName, connection });
        res.status(200).send(result);
    } catch (error: any) {
        logError(error);
        console.error('Could not fetch lead', error);
        if (isStandardError(error)) {
            throw error;
        }
        throw new InternalServerError({ error: 'Internal server error' });
    }
});

// crmRouter.post('/field-mapping', async (req, res) => {
//     try {
//     } catch (err: any) {
//         logError(err);
//     }
// });

export default crmRouter;
