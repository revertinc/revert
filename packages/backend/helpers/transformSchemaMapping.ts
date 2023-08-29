import { PrismaClient, TP_ID } from '@prisma/client';
import { StandardObjects, rootSchemaMappingId } from '../constants/common';
import logger from './logger';

const prisma = new PrismaClient();

export const transformFieldMappingToModel = async ({
    obj,
    tpId,
    objType,
    tenantSchemaMappingId,
}: {
    obj: any;
    tpId: TP_ID;
    objType: StandardObjects;
    tenantSchemaMappingId?: string;
}) => {
    logger.debug('blah obj: %o', obj);
    const connectionSchema = await prisma.schemas.findFirst({
        where: { object: objType, schema_mapping_id: !!tenantSchemaMappingId ? tenantSchemaMappingId : undefined },
        include: { fieldMappings: { where: { source_tp_id: tpId } } },
    });
    const rootSchema = await prisma.schemas.findFirst({
        where: { object: objType, schema_mapping_id: rootSchemaMappingId },
        include: { fieldMappings: { where: { source_tp_id: tpId } } },
    });
    const transformedObj: Record<string, any> = {};
    (connectionSchema?.fields || rootSchema?.fields)?.forEach((field) => {
        const fieldMapping =
            connectionSchema?.fieldMappings?.find((r) => r?.target_field_name === field) ||
            rootSchema?.fieldMappings?.find((r) => r?.target_field_name === field);
        const transformedKey = fieldMapping?.source_field_name;
        if (transformedKey) {
            // map custom fields under "additional"
            if (fieldMapping.is_standard_field) {
                transformedObj[field] = obj[transformedKey];
            } else {
                transformedObj['additional'] = {
                    ...transformedObj.additional,
                    [field]: obj[transformedKey],
                };
            }
        }
    });
    logger.debug('blah transformedObj: %o', transformedObj);
    return transformedObj;
};

export const transformModelToFieldMapping = async ({
    unifiedObj,
    tpId,
    objType,
    tenantSchemaMappingId,
}: {
    unifiedObj: any;
    tpId: TP_ID;
    objType: StandardObjects;
    tenantSchemaMappingId?: string;
}) => {
    logger.debug('blah unifiedObj: %o', unifiedObj);
    const connectionSchema = await prisma.schemas.findFirst({
        where: { object: objType, schema_mapping_id: !!tenantSchemaMappingId ? tenantSchemaMappingId : undefined },
        include: { fieldMappings: { where: { source_tp_id: tpId } } },
    });
    const rootSchema = await prisma.schemas.findFirst({
        where: { object: objType, schema_mapping_id: rootSchemaMappingId },
        include: { fieldMappings: { where: { source_tp_id: tpId } } },
    });
    const crmObj: Record<string, string> = {};
    // should this loop be on connection / root schema fields?
    Object.keys(unifiedObj).forEach((key) => {
        const tenantFieldMapping = connectionSchema?.fieldMappings?.find((r) => r?.target_field_name === key);
        const fieldMapping = rootSchema?.fieldMappings?.find((r) => r?.target_field_name === key);
        const crmKey = tenantFieldMapping?.source_field_name || fieldMapping?.source_field_name;
        if (crmKey) {
            crmObj[crmKey] = unifiedObj[key];
        }
    });
    logger.debug('blah crmObj: %o', crmObj);
    return crmObj;
};
