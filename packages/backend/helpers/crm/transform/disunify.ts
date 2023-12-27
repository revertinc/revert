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
            if (obj.additional) {
                Object.keys(obj.additional).forEach((key: any) => (transformedObj[key] = obj.additional[key]));
            }

            let priority: any;
            if (obj.priority === 'urgent') priority = 1;
            else if (obj.priority === 'high') priority = 2;
            else if (obj.priority === 'medium') priority = 3;
            else if (obj.priority === 'low') priority = 4;
            else priority = 0;

            return {
                ...transformedObj,
                priority: priority,
                priorityLabel: undefined,
            };
        }
        case TP_ID.clickup: {
            if (obj.associations) {
                Object.keys(obj.associations).forEach((key: any) => (transformedObj[key] = obj.associations[key]));
            }
            if (obj.additional) {
                Object.keys(obj.additional).forEach((key: any) => (transformedObj[key] = obj.additional[key]));
            }
            if (obj.associations && obj.associations.listId) transformedObj['listId'] = obj.associations.listId;
            if (obj.assignees) transformedObj['assignees'] = obj.assignees;

            let status: any;
            if (obj.status === 'open') status = 'to do';
            else if (obj.status === 'in_progress') status = 'in progress';
            else if (obj.status === 'closed') status = 'complete';
            else status = undefined;

            let priority: any;
            if (obj.priority === 'urgent') priority = '1';
            else if (obj.priority === 'high') priority = '2';
            else if (obj.priority === 'medium') priority = '3';
            else if (obj.priority === 'low') priority = '4';
            else priority = undefined;

            return {
                ...transformedObj,
                date_done: obj.completedDate ? Date.parse(obj.completedDate) : undefined,
                due_date: obj.dueDate ? Date.parse(obj.dueDate) : undefined,
                status,
                priority,
            };
        }
        case TP_ID.jira: {
            if (obj.associations) {
                Object.keys(obj.associations).forEach((key: any) => (transformedObj[key] = obj.associations[key]));
            }
            if (obj.additional) {
                Object.keys(obj.additional).forEach((key: any) => (transformedObj[key] = obj.additional[key]));
            }

            return {
                fields: {
                    ...transformedObj,
                    assignee:
                        obj.assignees && Array.isArray(obj.assignees) && obj.assignees.length > 0
                            ? {
                                  id: obj.assignees[0],
                              }
                            : undefined,
                },
            };
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
