import { TP_ID, accountFieldMappingConfig } from '@prisma/client';
import { StandardObjects } from '../../../constants/common';
import { PipedriveDealStatus } from '../../../constants/pipedrive';
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
    const processedObj = preprocessObject({ obj, tpId, objType });
    const transformedObject = await transformFieldMappingToModel({
        obj: processedObj,
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

const preprocessObject = <T extends Record<string, any>>({
    obj,
    tpId,
    objType,
}: {
    obj: T;
    tpId: TP_ID;
    objType: StandardObjects;
}) => {
    const preprocessMap: any = {
        [TP_ID.pipedrive]: {
            [StandardObjects.deal]: (obj: T) => {
                return {
                    ...obj,
                    revert_isWon: obj.status === PipedriveDealStatus.won,
                };
            },
        },
        [TP_ID.zohocrm]: {
            [StandardObjects.deal]: (obj: T) => {
                return {
                    ...obj,
                    revert_isWon: obj.Stage === 'Closed (Won)',
                };
            },
        },
    };
    const transformFn = (preprocessMap[tpId] || {})[objType];
    return transformFn ? transformFn(obj) : obj;
};
