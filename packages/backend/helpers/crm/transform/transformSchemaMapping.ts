import { get, merge } from 'lodash';
import { Prisma, PrismaClient, TP_ID, accountFieldMappingConfig } from '@prisma/client';
import { StandardObjects, rootSchemaMappingId } from '../../../constants/common';
import { logDebug } from '../../logger';

const prisma = new PrismaClient();

export const transformFieldMappingToModel = async ({
    obj,
    tpId,
    objType,
    tenantSchemaMappingId,
    accountFieldMappingConfig,
}: {
    obj: any;
    tpId: TP_ID;
    objType: StandardObjects;
    tenantSchemaMappingId?: string;
    accountFieldMappingConfig?: accountFieldMappingConfig;
}) => {
    logDebug('transformFieldMappingToModel obj:', obj);
    const connectionSchema = await prisma.schemas.findFirst({
        where: { object: objType, schema_mapping_id: !!tenantSchemaMappingId ? tenantSchemaMappingId : undefined },
        include: { fieldMappings: { where: { source_tp_id: tpId } } },
    });
    const rootSchema = await prisma.schemas.findFirst({
        where: { object: objType, schema_mapping_id: rootSchemaMappingId },
        include: { fieldMappings: { where: { source_tp_id: tpId } } },
    });
    let transformedObj: Record<string, any> = {};
    (connectionSchema?.fields || rootSchema?.fields)?.forEach((field) => {
        const fieldMapping =
            connectionSchema?.fieldMappings?.find(
                (r) =>
                    r?.target_field_name === field &&
                    (!accountFieldMappingConfig?.id ||
                        (r?.is_standard_field
                            ? ((accountFieldMappingConfig?.mappable_by_connection_field_list as Prisma.JsonArray) || [])
                                  .filter((a: any) => a.objectName === objType)
                                  .map((a: any) => a.fieldName)
                                  .includes(field)
                            : accountFieldMappingConfig?.allow_connection_override_custom_fields))
            ) || rootSchema?.fieldMappings?.find((r) => r?.target_field_name === field);
        const transformedKey = fieldMapping?.source_field_name;
        if (transformedKey) {
            if (fieldMapping.is_standard_field) {
                transformedObj = assignValueToObject(transformedObj, field, get(obj, transformedKey));
            } else {
                // map custom fields under "additional"
                transformedObj['additional'] = {
                    ...transformedObj.additional,
                    [field]: get(obj, transformedKey),
                };
            }
        }
    });
    logDebug('transformFieldMappingToModel transformedObj:', transformedObj);
    return transformedObj;
};

export const transformModelToFieldMapping = async ({
    unifiedObj,
    tpId,
    objType,
    tenantSchemaMappingId,
    accountFieldMappingConfig,
}: {
    unifiedObj: any;
    tpId: TP_ID;
    objType: StandardObjects;
    tenantSchemaMappingId?: string;
    accountFieldMappingConfig?: accountFieldMappingConfig;
}) => {
    logDebug('transformModelToFieldMapping unifiedObj:', unifiedObj);
    const connectionSchema = await prisma.schemas.findFirst({
        where: { object: objType, schema_mapping_id: !!tenantSchemaMappingId ? tenantSchemaMappingId : undefined },
        include: { fieldMappings: { where: { source_tp_id: tpId } } },
    });

    const rootSchema = await prisma.schemas.findFirst({
        where: { object: objType, schema_mapping_id: rootSchemaMappingId },
        include: { fieldMappings: { where: { source_tp_id: tpId } } },
    });

    let crmObj: Record<string, string> = {};
    Object.keys(unifiedObj).forEach((key) => {
        const tenantFieldMapping = connectionSchema?.fieldMappings?.find(
            (r) =>
                r?.target_field_name === key &&
                (!accountFieldMappingConfig?.id ||
                    (r.is_standard_field
                        ? ((accountFieldMappingConfig?.mappable_by_connection_field_list as Prisma.JsonArray) || [])
                              .filter((a: any) => a.objectName === objType)
                              .map((a: any) => a.fieldName)
                              .includes(key)
                        : accountFieldMappingConfig?.allow_connection_override_custom_fields))
        );
        const rootFieldMapping = rootSchema?.fieldMappings?.find((r) => r?.target_field_name === key);
        const crmKey = tenantFieldMapping?.source_field_name || rootFieldMapping?.source_field_name;
        if (crmKey) {
            crmObj = assignValueToObject(crmObj, crmKey, get(unifiedObj, key));
        }
    });
    logDebug('transformModelToFieldMapping crmObj:', crmObj);
    return crmObj;
};

export const assignValueToObject = (obj: Record<string, any>, key: string, value: any) => {
    if (key.includes('.')) {
        const keys = key.split('.');
        let result;
        for (let i = keys.length - 1; i >= 0; i--) {
            if (i === keys.length - 1) {
                result = value;
            }
            result = {
                [keys[i]]: result,
            };
        }
        return merge(obj, result);
    }
    return {
        ...obj,
        [key]: value,
    };
};
