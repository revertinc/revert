import { get } from 'lodash';
import { PrismaClient, TP_ID, accountFieldMappingConfig } from '@prisma/client';
import { StandardObjects, rootSchemaMappingId } from '../../../constants/common';
import logger from '../../logger';

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
            connectionSchema?.fieldMappings?.find(
                (r) =>
                    r?.target_field_name === field &&
                    (!accountFieldMappingConfig?.id ||
                        (r?.is_standard_field
                            ? (accountFieldMappingConfig?.mappable_by_connection_field_list || []).includes(field)
                            : accountFieldMappingConfig?.allow_connection_override_custom_fields))
            ) || rootSchema?.fieldMappings?.find((r) => r?.target_field_name === field);
        const transformedKey = fieldMapping?.source_field_name;
        if (transformedKey) {
            if (fieldMapping.is_standard_field) {
                transformedObj[field] = get(obj, transformedKey);
            } else {
                // map custom fields under "additional"
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
    accountFieldMappingConfig,
}: {
    unifiedObj: any;
    tpId: TP_ID;
    objType: StandardObjects;
    tenantSchemaMappingId?: string;
    accountFieldMappingConfig?: accountFieldMappingConfig;
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
    Object.keys(unifiedObj).forEach((key) => {
        const tenantFieldMapping = connectionSchema?.fieldMappings?.find(
            (r) =>
                r?.target_field_name === key &&
                (!accountFieldMappingConfig?.id ||
                    (r.is_standard_field
                        ? (accountFieldMappingConfig?.mappable_by_connection_field_list || []).includes(key)
                        : accountFieldMappingConfig?.allow_connection_override_custom_fields))
        );
        const rootFieldMapping = rootSchema?.fieldMappings?.find((r) => r?.target_field_name === key);
        const crmKey = tenantFieldMapping?.source_field_name || rootFieldMapping?.source_field_name;
        if (crmKey) {
            crmObj[crmKey] = unifiedObj[key];
        }
    });
    logger.debug('blah crmObj: %o', crmObj);
    return crmObj;
};
