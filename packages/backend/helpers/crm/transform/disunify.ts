import { TP_ID, accountFieldMappingConfig } from '@prisma/client';
import {
    ACCOUNTING_TP_ID,
    AccountingStandardObjects,
    ATS_TP_ID,
    AtsStandardObjects,
    CHAT_TP_ID,
    CRM_TP_ID,
    ChatStandardObjects,
    StandardObjects,
    TICKET_TP_ID,
    TicketStandardObjects,
} from '../../../constants/common';
import { transformModelToFieldMapping } from '.';
import {
    handleHubspotDisunify,
    handleMSDynamicsSales,
    handlePipedriveDisunify,
    handleSfdcDisunify,
    handleZohoDisunify,
} from '..';

import {
    postprocessDisUnifyAccoutingObject,
    postprocessDisUnifyAtsObject,
    postprocessDisUnifyObject,
    postprocessDisUnifyTicketObject,
} from './preprocess';

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
        case TP_ID.ms_dynamics_365_sales: {
            return handleMSDynamicsSales({ obj, objType, transformedObj: processedObj });
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

    if (obj.additional) {
        Object.keys(obj.additional).forEach((key: any) => (transformedObj[key] = obj.additional[key]));
    }

    const processedObj = postprocessDisUnifyTicketObject({ obj: transformedObj, tpId, objType });
    switch (tpId) {
        case TP_ID.linear: {
            if (objType === 'ticketTask') {
                if (obj.assignees && obj.assignees.length > 0) {
                    transformedObj['assigneeId'] = obj.assignees[0];
                }

                let priority: any;
                if (obj.priority === 'urgent') priority = 1;
                else if (obj.priority === 'high') priority = 2;
                else if (obj.priority === 'medium') priority = 3;
                else if (obj.priority === 'low') priority = 4;
                else priority = 0;

                let status: any;
                if (obj.status === 'open') status = 'Todo';
                else if (obj.status === 'in_progress') status = 'In Progress';
                else if (obj.status === 'closed') status = 'Done';
                delete transformedObj.priorityLabel;
                return {
                    ...transformedObj,
                    priority: priority,
                    state: status,
                    teamId: obj['listId'],
                };
            } else if (objType === 'ticketComment') {
                let parentId = undefined;
                if (transformedObj._parent && obj.parentId) {
                    parentId = obj.parentId;
                    delete transformedObj._parent;
                }
                return {
                    ...transformedObj,
                    issueId: obj.taskId ? obj.taskId : undefined,
                    parentId: parentId ? parentId : undefined,
                };
            }
            return processedObj;
        }
        case TP_ID.clickup: {
            if (objType === 'ticketTask') {
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
                const dueDateUTC = new Date(obj.dueDate).toUTCString();
                const dateDoneUTC = new Date(obj.due_date).toUTCString();
                return {
                    ...transformedObj,
                    date_done: obj.completedDate ? Date.parse(dateDoneUTC) : undefined,
                    due_date: obj.dueDate ? Date.parse(dueDateUTC) : undefined,
                    status,
                    priority,
                    listId: obj.listId,
                };
            }
            return processedObj;
        }
        case TP_ID.jira: {
            if (objType === 'ticketTask') {
                let priorityId: string | undefined = undefined;
                if (obj.priority === 'urgent') priorityId = '1';
                else if (obj.priority === 'high') priorityId = '2';
                else if (obj.priority === 'medium') priorityId = '3';
                else if (obj.priority === 'low') priorityId = '4';
                else if (obj.priority === 'lowest') priorityId = '5';

                return {
                    fields: {
                        ...transformedObj,
                        assignee:
                            obj.assignees && Array.isArray(obj.assignees) && obj.assignees.length > 0
                                ? {
                                      id: obj.assignees[0],
                                  }
                                : undefined,
                        priority: priorityId
                            ? {
                                  id: priorityId,
                              }
                            : undefined,
                        project: {
                            key: obj.listId,
                        },
                        issuetype: {
                            id: obj.issueTypeId,
                        },
                    },
                };
            }

            return processedObj;
        }
        case TP_ID.asana: {
            return transformedObj;
        }
        case TP_ID.trello: {
            if (objType === 'ticketTask') {
                transformedObj['idList'] = obj.listId;

                return {
                    ...transformedObj,
                    idMembers:
                        obj.assignees && Array.isArray(obj.assignees) && obj.assignees.length > 0
                            ? obj.assignees
                            : undefined,
                };
            }

            return processedObj;
        }
        case TP_ID.bitbucket: {
            if (objType === 'ticketTask') {
                let priorityId: string | undefined = undefined;
                if (obj.priority === 'urgent') priorityId = 'blocker';
                else if (obj.priority === 'high') priorityId = 'critical';
                else if (obj.priority === 'medium') priorityId = 'major';
                else if (obj.priority === 'low') priorityId = 'minor';
                else if (obj.priority === 'lowest') priorityId = 'trivial';

                return {
                    ...transformedObj,
                    assignee:
                        obj.assignees && Array.isArray(obj.assignees) && obj.assignees.length > 0
                            ? {
                                  account_id: obj.assignees[0],
                              }
                            : undefined,
                    priority: priorityId ? priorityId : undefined,

                    kind: obj.issueTypeId ? obj.issueTypeId : undefined,
                };
            }
            return processedObj;
        }
        case TP_ID.github: {
            if (objType === 'ticketTask') {
                return {
                    ...transformedObj,
                    assignees:
                        obj.assignees && Array.isArray(obj.assignees) && obj.assignees.length > 0
                            ? obj.assignees
                            : undefined,
                };
            }

            return processedObj;
        }
    }
}
export async function disunifyAtsObject<T extends Record<string, any>>({
    obj,
    tpId,
    objType,
    tenantSchemaMappingId,
    accountFieldMappingConfig,
}: {
    obj: T;
    tpId: ATS_TP_ID;
    objType: AtsStandardObjects;
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

    if (obj.additional) {
        Object.keys(obj.additional).forEach((key: any) => (transformedObj[key] = obj.additional[key]));
    }
    const processedObj = postprocessDisUnifyAtsObject({ obj: transformedObj, tpId, objType });

    switch (tpId) {
        case TP_ID.lever: {
            if (objType === 'candidate') {
                const confidential = obj.is_private ? 'confidential' : 'non-confidential';

                let reversedEmails = [];
                if (obj.email_addresses && obj.email_addresses.length > 0) {
                    reversedEmails = obj.email_addresses.map((email: any) => {
                        return email.value;
                    });
                }

                let applicationsIds = [];
                if (obj.application_ids && obj.application_ids.length > 0) {
                    applicationsIds = obj.application_ids.map((id: string) => {
                        return { id: id };
                    });
                }

                let tags = [];
                if (obj.tags && obj.tags.length > 0) {
                    tags = obj.tags.map((tag: any) => {
                        return tag;
                    });
                }
                let phones = [];
                if (obj.phone_numbers && obj.phone_numbers.length > 0) {
                    phones = obj.phone_numbers.map((phone: any) => {
                        return { value: phone.value };
                    });
                }

                let socialLinks = [];

                if (obj.social_media_addresses && obj.social_media_addresses.length > 0) {
                    socialLinks = obj.social_media_addresses.map((address: any) => {
                        return address.value;
                    });
                }
                let websiteLinks = [];

                if (obj.website_addresses && obj.website_addresses.length > 0) {
                    websiteLinks = obj.website_addresses.map((address: any) => {
                        return address.value;
                    });
                }

                return {
                    ...transformedObj,
                    emails: reversedEmails,
                    confidentiality: confidential,
                    applicationsIds,
                    links: [...socialLinks, ...websiteLinks],
                    tags: tags,
                    phones,
                };
            } else if (objType === 'job') {
                const confidential = obj.is_private ? 'confidential' : 'non-confidential';

                let originalState: string | undefined = '';
                switch (obj.status) {
                    case 'open':
                        originalState = 'published';
                        break;
                    case 'closed':
                        originalState = 'rejected';
                        break;
                    case 'draft':
                        originalState = 'pending';
                        break;
                    default:
                        originalState = undefined;
                        break;
                }
                return {
                    ...transformedObj,
                    confidentiality: confidential,
                    state: originalState,
                };
            } else if (objType === 'offer') {
                let originalStatus: string | undefined;
                switch (obj.status) {
                    case 'unresolved':
                        originalStatus = 'draft';
                        break;
                    case 'rejected':
                        originalStatus = 'denied';
                        break;
                    case 'accepted':
                        originalStatus = 'signed';
                        break;
                    default:
                        originalStatus = undefined;
                        break;
                }

                return {
                    ...transformedObj,

                    status: originalStatus,
                };
            } else if (objType === 'department') {
                return {
                    ...transformedObj,
                    text: obj.name,
                };
            }

            return processedObj;
        }

        case TP_ID.greenhouse: {
            if (objType === 'candidate') {
                // every field below is an array
                return {
                    ...transformedObj,
                    application_ids: obj.application_ids,
                    tags: obj.tags,
                    attachments: obj.attachments,
                    phone_numbers: obj.phone_numbers,
                    addresses: obj.addresses,
                    email_addresses: obj.email_addresses,
                    website_addresses: obj.website_addresses,
                    social_media_addresses: obj.social_media_addresses,
                    applications: obj.applications,
                };
            } else if (objType === 'job') {
                return {
                    ...transformedObj,
                    departments: obj.departments,
                    offices: obj.offices,
                    openings: obj.openings,
                };
            } else if (objType === 'offer') {
                return {
                    ...transformedObj,
                };
            } else if (objType === 'department') {
                return {
                    ...transformedObj,
                    child_ids: obj.child_ids,
                    child_department_external_ids: obj.child_department_external_ids,
                };
            }

            return processedObj;
        }
    }
}
export async function disunifyAccountingObject<T extends Record<string, any>>({
    obj,
    tpId,
    objType,
    tenantSchemaMappingId,
    accountFieldMappingConfig,
}: {
    obj: T;
    tpId: ACCOUNTING_TP_ID;
    objType: AccountingStandardObjects;
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
    if (obj.additional) {
        Object.keys(obj.additional).forEach((key: any) => (transformedObj[key] = obj.additional[key]));
    }

    const processedObj = postprocessDisUnifyAccoutingObject({ obj: transformedObj, tpId, objType });

    switch (tpId) {
        case TP_ID.quickbooks: {
            if (objType === 'expense') {
                transformedObj['Line'] = obj.line;

                return {
                    ...transformedObj,
                };
            }

            return processedObj;
        }

        case TP_ID.xero: {
            if (objType === 'account') {
                const active = obj.active && obj.active === true ? 'ACTIVE' : 'ARCHIVED';
                return {
                    ...transformedObj,
                    Status: active,
                };
            }
            return processedObj;
        }
    }
}
