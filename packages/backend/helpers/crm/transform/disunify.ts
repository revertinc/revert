import { TP_ID, accountFieldMappingConfig } from '@prisma/client';
import {
    CHAT_TP_ID,
    CRM_TP_ID,
    ChatStandardObjects,
    StandardObjects,
    TICKET_TP_ID,
    TicketStandardObjects,
} from '../../../constants/common';
import { transformModelToFieldMapping } from '.';
import { handleHubspotDisunify, handlePipedriveDisunify, handleSfdcDisunify, handleZohoDisunify } from '..';
import { postprocessDisUnifyObject } from './preprocess';
import { flattenObj } from '../../../helpers/flattenObj';
import handleCloseCRMDisunify from '../closecrm';

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
    const flattenedObj = flattenObj(obj, ['additional', 'associations']);
    const transformedObj = await transformModelToFieldMapping({
        unifiedObj: flattenedObj,
        tpId,
        objType,
        tenantSchemaMappingId,
        accountFieldMappingConfig,
    });
    const processedObj = postprocessDisUnifyObject({ obj: transformedObj, tpId, objType });
    switch (tpId) {
        case TP_ID.hubspot: {
            return handleHubspotDisunify({ obj, objType, transformedObj: processedObj });
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
            return handleCloseCRMDisunify({ obj, transformedObj: processedObj });
        }
    }
}

export async function disunifyChatObject<T extends Record<string, any>>({
    obj,
    tpId,
    objType,
    tenantSchemaMappingId,
    accountFieldMappingConfig,
}: {
    obj: T;
    tpId: CHAT_TP_ID;
    objType: ChatStandardObjects;
    tenantSchemaMappingId?: string;
    accountFieldMappingConfig?: accountFieldMappingConfig;
}) {
    const flattenedObj = flattenObj(obj, ['additional']);
    const transformedObj = await transformModelToFieldMapping({
        unifiedObj: flattenedObj,
        tpId,
        objType,
        tenantSchemaMappingId,
        accountFieldMappingConfig,
    });

    switch (tpId) {
        case TP_ID.slack: {
            return transformedObj;
        }
        case TP_ID.discord: {
            return transformedObj;
        }
    }
}

export async function disunifyTicketObject<T extends Record<string, any>>({
    obj,
    tpId,
    objType,
    tenantSchemaMappingId,
    accountFieldMappingConfig,
}: {
    obj: T;
    tpId: TICKET_TP_ID;
    objType: TicketStandardObjects;
    tenantSchemaMappingId?: string;
    accountFieldMappingConfig?: accountFieldMappingConfig;
}) {
    const flattenedObj = flattenObj(obj, ['additional', 'associations']);
    const transformedObj = await transformModelToFieldMapping({
        unifiedObj: flattenedObj,
        tpId,
        objType,
        tenantSchemaMappingId,
        accountFieldMappingConfig,
    });

    switch (tpId) {
        case TP_ID.linear: {
            if (obj.associations) {
                Object.keys(obj.associations).forEach((key: any) => (transformedObj[key] = obj.associations[key]));
            }
            if (obj.assignees && obj.assignees.length > 0) {
                transformedObj['assigneeId'] = obj.assignees[0];
            }

            return transformedObj;
        }
        case TP_ID.clickup: {
            if (obj.associations) {
                Object.keys(obj.associations).forEach((key: any) => (transformedObj[key] = obj.associations[key]));
            }
            transformedObj['listId'] = obj.additional.listId;
            transformedObj['assignees'] = obj.assignees;

            return {
                ...transformedObj,
                date_done: obj.completedDate ? Date.parse(obj.completedDate) : null,
                due_date: obj.dueDate ? Date.parse(obj.dueDate) : null,
            };
        }
        case TP_ID.jira: {
            return transformedObj;
        }
        case TP_ID.asana: {
            return transformedObj;
        }
        case TP_ID.trello: {
            return transformedObj;
        }
        case TP_ID.jira: {
            return transformedObj;
        }
    }
}
