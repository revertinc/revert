import {
    CRM_TP_ID,
    ChatStandardObjects,
    StandardObjects,
    TicketStandardObjects,
    AccountingStandardObjects,
    AtsStandardObjects,
} from '../../../constants/common';

import { TP_ID, accountFieldMappingConfig } from '@prisma/client';

import { transformFieldMappingToModel } from '.';
import { preprocessUnifyObject } from './preprocess';

export async function unifyObject<T extends Record<string, any>, K>({
    obj,
    tpId,
    objType,
    tenantSchemaMappingId,
    accountFieldMappingConfig,
}: {
    obj: T;
    tpId: CRM_TP_ID;
    objType:StandardObjects
        | ChatStandardObjects
        | TicketStandardObjects
        | AtsStandardObjects
        | AccountingStandardObjects;
    tenantSchemaMappingId?: string;
    accountFieldMappingConfig?: accountFieldMappingConfig;
}): Promise<K> {
    const processedObj = preprocessUnifyObject({ obj, tpId, objType });
    const transformedObject = await transformFieldMappingToModel({
        obj: processedObj,
        tpId,
        objType,
        tenantSchemaMappingId,
        accountFieldMappingConfig,
    });
    const unifiedObject: {
        additional: any;
        associations: any | undefined;
    } = {
        ...transformedObject,
        additional: {
            ...(transformedObject.additional || {}),
        },
        associations: {},
    };
    // Map additional fields
    Object.keys(obj).forEach((key) => {
        if (!(key in unifiedObject) && key !== 'properties') {
            unifiedObject['additional'][key] = obj[key];
            if (unifiedObject.additional.lead_id || unifiedObject.additional.organization_id) {
                unifiedObject['associations']['leadId'] = unifiedObject.additional.lead_id;
                unifiedObject['associations']['companyId'] = unifiedObject.additional.organization_id;
            }
        }
    });
    if (tpId === TP_ID.hubspot) {
        if (obj.associations) {
            unifiedObject.associations = obj.associations;
        }
    }

    // Check if associations object is empty and set it to undefined
    if (Object.keys(unifiedObject.associations || {}).length === 0) {
        unifiedObject.associations = undefined;
    }

    return unifiedObject as K;
}
