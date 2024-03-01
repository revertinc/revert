import { PrismaClient, TP_ID } from '@prisma/client';
import { randomUUID } from 'crypto';

import { InternalServerError, NotFoundError } from '../../../generated/typescript/api/resources/common';
import { getObjectPropertiesForConnection } from '../../../services/crm/properties';
import revertAuthMiddleware from '../../../helpers/authMiddleware';
import { isStandardError } from '../../../helpers/error';
import { logError } from '../../../helpers/logger';
import revertTenantAuthMiddleware from '../../../helpers/tenantAuthMiddleware';
import { rootSchemaMappingId } from '../../../constants/common';
import revertTenantMiddleware from '../../../helpers/tenantIdMiddleware';
import { FieldMappingService } from '../../../generated/typescript/api/resources/crm/resources/fieldMapping/service/FieldMappingService';
import { FieldMappingType } from '../../../generated/typescript/api/resources/crm';

const prisma = new PrismaClient();

const fieldMappingService = new FieldMappingService(
    {
        async getFieldMappingConfig(_req, res) {
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
                    objects.map(async (obj: string) => {
                        fieldList[obj] = await getObjectPropertiesForConnection({ objectName: obj, connection });
                    })
                );

                res.send({
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
        },
        async getFieldMappings(_req, res) {
            const { connection } = res.locals;
            const tpId = connection.tp_id as TP_ID;

            try {
                if (!connection.schema_mapping_id) {
                    throw new NotFoundError({ error: 'No field mapping found for this connection' });
                }
                const fieldMappings = await prisma.fieldMappings.findMany({
                    where: { source_tp_id: tpId, schema: { is: { schema_mapping_id: connection.schema_mapping_id } } },
                    include: { schema: true },
                });
                const fieldMappingsResponse: FieldMappingType[] = fieldMappings.map((fm) => {
                    return {
                        sourceFieldName: fm.source_field_name!,
                        targetFieldName: fm.target_field_name!,
                        object: fm.schema.object!,
                    };
                });
                res.send({ mappings: fieldMappingsResponse, tpId: tpId });
            } catch (error: any) {
                logError(error);
                console.error('Could not get field mappings', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createFieldMapping(req, res) {
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
                    where: {
                        uniqueCustomerPerTenant: { t_id: connection.t_id, tp_customer_id: connection.tp_customer_id },
                    },
                    data: { schema_mapping_id: connectionSchemaMappingId },
                });
                res.send({ status: 'ok' });
            } catch (error: any) {
                logError(error);
                console.error('Could not create field mapping', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async deleteFieldMapping(_req, res) {
            const { connection } = res.locals;
            try {
                await prisma.schema_mapping.delete({
                    where: { id: connection.schema_mapping_id },
                });
                res.send({ status: 'ok', message: 'Field mapping deleted successfully' });
            } catch (error: any) {
                logError(error);
                console.error('Could not delete field mapping', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createAccountFieldMappingConfig(req, res) {
            const { account } = res.locals;
            const config = req.body;
            try {
                await prisma.accountFieldMappingConfig.create({
                    data: {
                        account_id: account.id,
                        allow_connection_override_custom_fields: config.allow_connection_override_custom_fields,
                        mappable_by_connection_field_list: config.mappable_by_connection_field_list.map(
                            (field: any) => ({
                                fieldName: field.fieldName,
                                objectName: field.objectName,
                            })
                        ),
                    },
                });
                res.send({ status: 'ok' });
            } catch (error: any) {
                logError(error);
                console.error('Could not create account field mapping config', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async deleteAccountFieldMappingConfig(_req, res) {
            const { account } = res.locals;
            try {
                await prisma.accountFieldMappingConfig.delete({
                    where: { account_id: account.id },
                });
                res.send({ status: 'ok' });
            } catch (error: any) {
                logError(error);
                console.error('Could not delete account field mapping config', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware(), revertTenantAuthMiddleware()]
);

export { fieldMappingService };
