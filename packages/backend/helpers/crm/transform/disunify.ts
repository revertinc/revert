import { TP_ID, accountFieldMappingConfig } from '@prisma/client';
import { CRM_TP_ID, StandardObjects } from '../../../constants/common';
import { transformModelToFieldMapping } from '.';
import { handleHubspotDisunify, handlePipedriveDisunify, handleSfdcDisunify, handleZohoDisunify } from '..';
import { postprocessDisUnifyObject } from './preprocess';
import { flattenObj } from '../../../helpers/flattenObj';

export async function disunifyObject<T extends Record<string, any>>({
    obj,
    tpId,
    objType,
    tenantSchemaMappingId,
    accountFieldMappingConfig,
}: {
    obj: T;
    tpId: CRM_TP_ID;
    objType: StandardObjects;
    tenantSchemaMappingId?: string;
    accountFieldMappingConfig?: accountFieldMappingConfig;
}) {
    console.log('OG object...', obj);
    const flattenedObj = flattenObj(obj, ['additional', 'associations']);
    console.log('Flattended  object...', flattenedObj);
    const transformedObj = await transformModelToFieldMapping({
        unifiedObj: flattenedObj,
        tpId,
        objType,
        tenantSchemaMappingId,
        accountFieldMappingConfig,
    });
    console.log('transformed obj...', transformedObj);
    const processedObj = postprocessDisUnifyObject({ obj: transformedObj, tpId, objType });
    console.log('Processed object....', processedObj);

    switch (tpId) {
        case TP_ID.hubspot: {
            const damn = handleHubspotDisunify({ obj, objType, transformedObj: processedObj });
            console.log('damn...', damn);
            return damn;
        }
        case TP_ID.pipedrive: {
            return handlePipedriveDisunify({ obj, transformedObj: processedObj });
        }
        case TP_ID.zohocrm: {
            return handleZohoDisunify({ obj, objType, transformedObj: processedObj });
        }
        case TP_ID.sfdc: {
            return handleSfdcDisunify({ obj, objType, transformedObj: processedObj });
        }
        case TP_ID.closecrm: {
            return processedObj;
        }
    }
}
