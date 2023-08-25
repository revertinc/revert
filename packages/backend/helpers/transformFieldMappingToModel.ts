import { OBJECT_TYPES, PrismaClient, TP_ID } from '@prisma/client';
import { rootSchemaMappingId } from '../constants/common';

const prisma = new PrismaClient();

export const transformFieldMappingToModel = async ({
    obj,
    tpId,
    objType,
}: {
    obj: any;
    tpId: TP_ID;
    objType: OBJECT_TYPES;
}) => {
    console.log('blah obj');
    console.dir(obj, { depth: null });
    const rootSchema = await prisma.schemas.findFirst({
        where: { object: objType, schema_mapping_id: rootSchemaMappingId },
        include: { fieldMappings: { where: { source_tp_id: tpId } } },
    });
    const transformedObj: Record<string, string> = {};
    rootSchema?.fields?.forEach((field) => {
        const fieldMapping = rootSchema?.fieldMappings?.find((r) => r?.target_field_name === field);
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
}: {
    unifiedObj: any;
    tpId: TP_ID;
    objType: OBJECT_TYPES;
}) => {
    console.log('blah unifiedObj');
    console.dir(unifiedObj, { depth: null });
    const rootSchema = await prisma.schemas.findFirst({
        where: { object: objType, schema_mapping_id: rootSchemaMappingId },
        include: { fieldMappings: { where: { source_tp_id: tpId } } },
    });
    const crmObj: Record<string, string> = {};
    Object.keys(unifiedObj).forEach(key => {
        const fieldMapping = rootSchema?.fieldMappings?.find((r) => r?.target_field_name === key);
        const crmKey = fieldMapping?.source_field_name;
        if (crmKey) {
            crmObj[crmKey] = unifiedObj[key];
        }
    })
    console.log('blah crmObj');
    console.dir(crmObj, { depth: null });
    return crmObj;
};
