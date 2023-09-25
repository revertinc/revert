import express from 'express';
import { randomUUID } from 'crypto';
import { createSession } from 'better-sse';
import { PrismaClient, TP_ID } from '@prisma/client';
import authRouter from './auth';
import { getObjectPropertiesForConnection } from '../../../services/crm/properties';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../../redis/client/pubsub';
import logger from '../../../helpers/logger';
import logError from '../../../helpers/logError';
import { isStandardError } from '../../../helpers/error';
import revertTenantMiddleware from '../../../helpers/tenantIdMiddleware';
import { InternalServerError } from '../../../generated/typescript/api/resources/common';
import { StandardObjects, rootSchemaMappingId } from '../../../constants/common';

const prisma = new PrismaClient();

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
        const { tenantId } = req.query;
        const session = await createSession(req, res);
        await pubsub.subscribe(PUBSUB_CHANNELS.INTEGRATION_STATUS, (message: any) => {
            logger.debug('pubsub message', message);
            const parsedMessage = JSON.parse(message) as IntegrationStatusSseMessage;
            if (parsedMessage.publicToken === publicToken && parsedMessage.tenantId === tenantId) {
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

    try {
        const {
            allow_connection_override_custom_fields: canAddCustomMapping = false,
            mappable_by_connection_field_list: mappableFields = [],
        } = accountFieldMappingConfig || {};

        const objects = mappableFields.map((f: any) => f.objectName);
        const fieldList: Record<string, any> = {};
        await Promise.allSettled(
            (canAddCustomMapping ? Object.values(StandardObjects) : objects).map(async (obj: string) => {
                // Can this be cached?
                fieldList[obj] = await getObjectPropertiesForConnection({ objectName: obj, connection });
            })
        );

        res.status(200).send({
            canAddCustomMapping,
            mappableFields,
            fieldList,
        });
    } catch (error: any) {
        logError(error);
        console.error('Could not get field mapping', error);
        if (isStandardError(error)) {
            throw error;
        }
        throw new InternalServerError({ error: 'Internal server error' });
    }
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

crmRouter.post('/field-mapping', revertTenantMiddleware(), async (req, res) => {
    const { connection } = res.locals;
    const tpId = connection.tp_id as TP_ID;

    try {
        type mappingReq = { sourceFieldName: string; targetFieldName: string; object: string };
        const standardMappings: mappingReq[] = req.body.standardMappings || [];
        const customMappings: mappingReq[] = req.body.customMappings || [];

        const objects = [
            ...new Set([...standardMappings.map((s) => s.object), ...customMappings.map((c) => c.object)]),
        ];

        const rootSchema = await prisma.schemas.findMany({
            where: { object: { in: objects }, schema_mapping_id: rootSchemaMappingId },
            include: { fieldMappings: { where: { source_tp_id: tpId } } },
        });

        const connectionSchemaMappingId = randomUUID();

        const customFields = customMappings.map((c) => c.targetFieldName);

        const schemas = objects.map((object) => ({
            id: randomUUID(),
            fields: [...(rootSchema.find((s) => s.object === object)?.fields || []), ...customFields],
            object,
        }));
        await prisma.schema_mapping.create({
            data: {
                id: connectionSchemaMappingId,
                object_schemas: { createMany: { data: schemas } },
                object_schema_ids: schemas.map((s) => s.id),
            },
        });

        const standardFieldMappings = standardMappings.map((standardMapping) => ({
            id: randomUUID(),
            source_tp_id: tpId,
            source_field_name: standardMapping.sourceFieldName,
            target_field_name: standardMapping.targetFieldName,
            is_standard_field: true,
            schema_id: schemas.find((s) => s.object === standardMapping.object)!.id,
        }));
        const customFieldMappings = customMappings.map((customMapping) => ({
            id: randomUUID(),
            source_tp_id: tpId,
            source_field_name: customMapping.sourceFieldName,
            target_field_name: customMapping.targetFieldName,
            is_standard_field: false,
            schema_id: schemas.find((s) => s.object === customMapping.object)!.id,
        }));
        await prisma.fieldMappings.createMany({ data: standardFieldMappings });
        await prisma.fieldMappings.createMany({ data: customFieldMappings });

        await prisma.connections.update({
            where: { uniqueCustomerPerTenant: { t_id: connection.t_id, tp_customer_id: connection.tp_customer_id } },
            data: { schema_mapping_id: connectionSchemaMappingId },
        });
        res.status(200).send({ status: 'ok' });
    } catch (error: any) {
        logError(error);
        console.error('Could not create field mapping', error);
        if (isStandardError(error)) {
            throw error;
        }
        throw new InternalServerError({ error: 'Internal server error' });
    }
});

export default crmRouter;
