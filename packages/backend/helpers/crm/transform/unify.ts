import { TP_ID, accountFieldMappingConfig } from '@prisma/client';
import { StandardObjects } from '../../../constants/common';
import { transformFieldMappingToModel } from '.';

export async function unifyObject<T extends Record<string, any>, K>({
    obj,
    tpId,
    objType,
    tenantSchemaMappingId,
    accountFieldMappingConfig,
}: {
    obj: T;
    tpId: TP_ID;
    objType: StandardObjects;
    tenantSchemaMappingId?: string;
    accountFieldMappingConfig?: accountFieldMappingConfig;
}): Promise<K> {
    const transformedObject = await transformFieldMappingToModel({
        obj,
        tpId,
        objType,
        tenantSchemaMappingId,
        accountFieldMappingConfig,
    });
    const unifiedObject = {
        ...transformedObject,
        additional: {
            ...(transformedObject.additional || {}),
        },
    };

    // Map additional fields
    Object.keys(obj).forEach((key) => {
        if (!(key in unifiedObject) && key !== 'properties') {
            unifiedObject['additional'][key] = obj[key];
        }
    });

    return unifiedObject as K;
}
