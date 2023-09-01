import { TP_ID, accountFieldMappingConfig } from '@prisma/client';
import { StandardObjects } from '../../../constants/common';
import { transformModelToFieldMapping } from '.';
import { handleHubspotDisunify, handlePipedriveDisunify, handleSfdcDisunify, handleZohoDisunify } from '..';

export async function disunifyObject<T extends Record<string, any>>({
    obj,
    tpId,
    objType,
}: {
    obj: T;
    tpId: TP_ID;
    objType: StandardObjects;
    tenantSchemaMappingId?: string;
    accountFieldMappingConfig?: accountFieldMappingConfig;
}) {
    const transformedObj = await transformModelToFieldMapping({
        unifiedObj: obj,
        tpId,
        objType,
    });
    switch (tpId) {
        case TP_ID.hubspot: {
            return handleHubspotDisunify({ obj, objType, transformedObj });
        }
        case TP_ID.pipedrive: {
            return handlePipedriveDisunify({ obj, transformedObj });
        }
        case TP_ID.zohocrm: {
            return handleZohoDisunify({ obj, objType, transformedObj });
        }
        case TP_ID.sfdc: {
            return handleSfdcDisunify({ obj, objType, transformedObj });
        }
    }
}
