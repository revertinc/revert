import { OBJECT_TYPES, PrismaClient, TP_ID } from '@prisma/client';
import { rootSchemaMappingId } from '../constants/common';

const prisma = new PrismaClient();

export const transformFieldMappingToModel = async ({
    obj,
    tpId,
    objType,
    tenantSchemaMappingId,
}: {
    obj: any;
    tpId: TP_ID;
    objType: OBJECT_TYPES;
    tenantSchemaMappingId?: string;
}) => {
    console.log('blah obj');
    console.dir(obj, { depth: null });
    const connectionSchema = await prisma.schemas.findFirst({
        where: { object: objType, schema_mapping_id: !!tenantSchemaMappingId ? tenantSchemaMappingId : undefined },
        include: { fieldMappings: { where: { source_tp_id: tpId } } },
    });
    const rootSchema = await prisma.schemas.findFirst({
        where: { object: objType, schema_mapping_id: rootSchemaMappingId },
        include: { fieldMappings: { where: { source_tp_id: tpId } } },
    });
    const transformedObj: Record<string, string> = {};
    (connectionSchema?.fields || rootSchema?.fields)?.forEach((field) => {
        const fieldMapping =
            connectionSchema?.fieldMappings?.find((r) => r?.target_field_name === field) ||
            rootSchema?.fieldMappings?.find((r) => r?.target_field_name === field);
        const transformedKey = fieldMapping?.source_field_name;
        if (transformedKey) {
            transformedObj[field] = obj[transformedKey];
        }
    });
    console.log('blah transformedObj');
    console.dir(transformedObj, { depth: null });
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
    objType: OBJECT_TYPES;
    tenantSchemaMappingId?: string;
}) => {
    console.log('blah unifiedObj');
    console.dir(unifiedObj, { depth: null });
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
    console.log('blah crmObj');
    console.dir(crmObj, { depth: null });
    return crmObj;
};
