import { TP_ID } from '@prisma/client';
import {
    CRM_TP_ID,
    ChatStandardObjects,
    StandardObjects,
    TICKET_TP_ID,
    TicketStandardObjects,
} from '../../../constants/common';
import { PipedriveDealStatus } from '../../../constants/pipedrive';
import { convertToHHMMInUTC, getDuration, getFormattedDate } from '../../../helpers/timeZoneHelper';
import dayjs from 'dayjs';

export const preprocessUnifyObject = <T extends Record<string, any>>({
    obj,
    tpId,
    objType,
}: {
    obj: T;
    tpId: CRM_TP_ID | TICKET_TP_ID;
    objType: StandardObjects | ChatStandardObjects | TicketStandardObjects;
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
        [TP_ID.closecrm]: {
            [StandardObjects.contact]: (obj: T) => {
                if (obj.name) {
                    const names = obj.name.split(' ');
                    const modifiedObj = {
                        ...obj,
                        firstName: names[0],
                        lastName: names[1],
                    };
                    return modifiedObj;
                }
                return { ...obj };
            },
            [StandardObjects.lead]: (obj: T) => {
                if (obj.name) {
                    const names = obj.name.split(' ');
                    const modifiedObj = {
                        ...obj,
                        firstName: names[0],
                        lastName: names[1],
                    };
                    return modifiedObj;
                }
                return { ...obj };
            },
            [StandardObjects.deal]: (obj: T) => {
                return {
                    ...obj,
                    isWon: obj['status_type'] === 'won' ? true : false,
                    confidence: obj['confidence'] ? Number((parseInt(obj['confidence']) / 100).toFixed(4)) : undefined,
                    value: obj['value'] ? Number(obj['value']) / 100 : undefined,
                };
            },
        },
        [TP_ID.ms_dynamics_365_sales]: {
            [StandardObjects.note]: (obj: T) => {
                return obj.notetext ? obj : { ...obj, notetext: obj.subject };
            },
            [StandardObjects.task]: (obj: T) => {
                const modifiedObj: any = {};
                /*
                Microsoft Priority codes
                    0 : Low
                    1 : Normal
                    2 : High
                */
                if (obj.prioritycode !== undefined && obj.prioritycode !== null) {
                    let priority = null;
                    if (obj.prioritycode === 0) priority = 'low';
                    else if (obj.prioritycode === 1) priority = 'normal';
                    else if (obj.prioritycode === 2) priority = 'high';
                    modifiedObj.priority = priority;
                }
                /*
                Microsoft state code
                    0 : Open
                    1 : Completed
                    2 : Canceled
                */
                if (obj.statecode !== undefined && obj.statecode !== null) {
                    let status = null;
                    if (obj.statecode === 0) status = 'open';
                    else if (obj.statecode == 1) status = 'completed';
                    else if (obj.statecode == 2) status = 'canceled';
                    modifiedObj.status = status;
                }
                return { ...obj, ...modifiedObj };
            },
            [StandardObjects.deal]: (obj: T) => {
                const modifiedObj: any = {};

                if (obj.closeprobability && obj.closeprobability !== 0) {
                    modifiedObj.closeprobability = obj.closeprobability / 100;
                }
                /*
                    Microsoft opportunityratingcode
                        1 : Hot
                        2 : Warm
                        3 : Cold
                */
                if (obj.opportunityratingcode) {
                    const ratingCode = obj.opportunityratingcode;
                    if (ratingCode === 1) modifiedObj.opportunityratingcode = 'hot';
                    else if (ratingCode === 2) modifiedObj.opportunityratingcode = 'warm';
                    else if (ratingCode === 3) modifiedObj.opportunityratingcode = 'cold';
                }

                /*
                    Microsoft salesstagecode
                        0 : Qualify
                        1 : Develop
                        2 : Propose
                        3 : Close
                */
                if (obj.salesstagecode) {
                    const salesstagecode = obj.salesstagecode;
                    if (salesstagecode === 0) modifiedObj.salesstagecode = 'qualify';
                    else if (salesstagecode === 1) modifiedObj.salesstagecode = 'develop';
                    else if (salesstagecode === 2) modifiedObj.salesstagecode = 'propose';
                    else if (salesstagecode === 3) modifiedObj.salesstagecode = 'close';
                }

                /*
                    Microsoft statecode
                        0 : open
                        1 : won
                        2 : lost
                */
                modifiedObj.statecode = obj.statecode && obj.statecode === 1 ? true : false;

                return { ...obj, ...modifiedObj };
            },
        },
        [TP_ID.linear]: {
            [TicketStandardObjects.ticketTask]: (obj: T) => {
                let status: string;
                if (obj.state.name === 'Todo' || obj.state.name === 'Backlog') status = 'open';
                else if (
                    obj.state.name === 'Done' ||
                    obj.state.name === 'Canceled' ||
                    obj.state.name === 'Cancelled' ||
                    obj.state.name === 'Duplicate'
                )
                    status = 'closed';
                else if (obj.state.name === 'In Progress') status = 'in_progress';
                else status = obj.state.name;
                return {
                    ...obj,
                    assignee: obj._assignee ? [obj._assignee.id] : null,
                    priorityLabel:
                        obj['priorityLabel'] === 'No priority' ? 'lowest' : String(obj['priorityLabel']).toLowerCase(),
                    state: status ? status : null,
                };
            },
        },
        [TP_ID.clickup]: {
            [TicketStandardObjects.ticketTask]: (obj: T) => {
                let status: string;
                if (obj.status && obj.status.status === 'to do') status = 'open';
                else if (obj.status && obj.status.status === 'in progress') status = 'in_progress';
                else if (obj.status && obj.status.status === 'complete') status = 'closed';
                else status = obj.status;

                let priority: any;
                if (obj.priority && obj.priority.priority === 'urgent' && Number(obj.priority.id) === 1)
                    priority = 'urgent';
                else if (obj.priority && obj.priority.priority === 'high' && Number(obj.priority.id) === 2)
                    priority = 'high';
                else if (obj.priority && obj.priority.priority === 'normal' && Number(obj.priority.id) === 3)
                    priority = 'medium';
                else if (obj.priority && obj.priority.priority === 'low' && Number(obj.priority.id) === 4)
                    priority = 'low';
                else priority = 'lowest';
                return {
                    ...obj,
                    assignees: obj.assignees.length > 0 ? obj.assignees.map((assignee: any) => assignee.id) : [],
                    date_created: obj.date_created ? new Date(Number(obj.date_created)).toISOString() : null,
                    date_updated: obj.date_updated ? new Date(Number(obj.date_updated)).toISOString() : null,
                    date_done: obj.date_done ? dayjs(Number(obj.due_date)).format('YYYY-MM-DD') : null,
                    due_date: obj.due_date ? dayjs(Number(obj.due_date)).format('YYYY-MM-DD') : null,
                    status,
                    priority,
                };
            },
            [TicketStandardObjects.ticketComment]: (obj: T) => {
                const date = new Date(Number(obj.date));
                return {
                    ...obj,
                    date: date.toISOString(),
                };
            },
        },
        [TP_ID.jira]: {
            [TicketStandardObjects.ticketTask]: (obj: T) => {
                if (obj.priority) {
                    if (obj.priority.id === '1' && obj.priority.name === 'Highest') obj.priority.name = 'urgent';
                    else if (obj.priority.id === '2' && obj.priority.name === 'High') obj.priority.name = 'high';
                    else if (obj.priority.id === '3' && obj.priority.name === 'Medium') obj.priority.name = 'medium';
                    else if (obj.priority.id === '4' && obj.priority.name === 'Low') obj.priority.name = 'low';
                    else obj.priority.name = 'lowest';
                }

                if (obj.status) {
                    if (String(obj.status.name).toLowerCase() === 'to do') obj.status.name = 'open';
                    else if (String(obj.status.name).toLowerCase() === 'in progress') obj.status.name = 'in_progress';
                    else if (String(obj.status.name).toLowerCase() === 'done') obj.status.name = 'closed';
                }

                return { ...obj, assignee: obj.assignee ? [obj.assignee.accountId] : undefined };
            },
        },
    };
    const transformFn = (preprocessMap[tpId] || {})[objType];
    return transformFn ? transformFn(obj) : obj;
};

export const postprocessDisUnifyObject = <T extends Record<string, any>>({
    obj,
    tpId,
    objType,
}: {
    obj: T;
    tpId: CRM_TP_ID;
    objType: StandardObjects;
}) => {
    const preprocessMap: Record<CRM_TP_ID, Record<any, Function>> = {
        [TP_ID.pipedrive]: {
            [StandardObjects.event]: (obj: T) => {
                let dateObj = {};
                if (obj.due_time && obj.end_time) {
                    dateObj = {
                        due_time: convertToHHMMInUTC(obj.due_time),
                        due_date: getFormattedDate(obj.due_time),
                        duration: getDuration(obj.due_time, obj.end_time),
                        end_time: undefined,
                    };
                }
                return {
                    ...obj,
                    ...dateObj,
                    type: 'meeting',
                };
            },
            [StandardObjects.task]: (obj: T) => {
                return {
                    ...obj,
                    type: 'task',
                };
            },
            [StandardObjects.deal]: (obj: T) => {
                return {
                    ...obj,
                    status: obj.revert_isWon ? PipedriveDealStatus.won : PipedriveDealStatus.open,
                    revert_isWon: undefined,
                };
            },
            [StandardObjects.contact]: (obj: T) => {
                return {
                    ...obj,
                    name: `${obj.first_name} ${obj.last_name}`,
                };
            },
            [StandardObjects.lead]: (obj: T) => {
                return {
                    ...obj,
                    person: undefined,
                };
            },
        },
        [TP_ID.sfdc]: {
            [StandardObjects.deal]: (obj: T) => {
                return {
                    ...obj,
                    Probability: Number(obj.Probability) * 100,
                };
            },
            [StandardObjects.company]: (obj: T) => {
                return {
                    ...obj,
                    Type: obj.additional?.type,
                };
            },
        },
        [TP_ID.zohocrm]: {
            [StandardObjects.deal]: (obj: T) => {
                return {
                    ...obj,
                    Probability: Number(obj.Probability) * 100,
                };
            },
            [StandardObjects.company]: (obj: T) => {
                return {
                    ...obj,
                    Account_Type: obj.additional?.type,
                };
            },
        },
        [TP_ID.hubspot]: {
            [StandardObjects.event]: (obj: T) => {
                return {
                    ...obj,
                    hs_timestamp: Date.now().toString(),
                };
            },
            [StandardObjects.note]: (obj: T) => {
                return {
                    ...obj,
                    hs_timestamp: Date.now().toString(),
                };
            },
            [StandardObjects.task]: (obj: T) => {
                return {
                    ...obj,
                    hs_timestamp: Date.now().toString(),
                };
            },
        },
        [TP_ID.closecrm]: {
            [StandardObjects.deal]: (obj: T) => {
                return {
                    ...obj,
                    confidence: obj.confidence ? obj.confidence * 100 : undefined,
                    value: obj.value ? obj.value * 100 : undefined,
                };
            },
        },
        [TP_ID.ms_dynamics_365_sales]: {},
    };
    const transformFn = (preprocessMap[tpId] || {})[objType];
    return transformFn ? transformFn(obj) : obj;
};

export const postprocessDisUnifyTicketObject = <T extends Record<string, any>>({
    obj,
    tpId,
    objType,
}: {
    obj: T;
    tpId: TICKET_TP_ID;
    objType: TicketStandardObjects;
}) => {
    const preprocessMap: Record<TICKET_TP_ID, Record<any, Function>> = {
        [TP_ID.linear]: {
            // [TicketStandardObjects.ticketComment]: (obj: T) => {
            //     return obj;
            // },
        },
        [TP_ID.clickup]: {},
        [TP_ID.jira]: {},
        [TP_ID.trello]: {},
        [TP_ID.asana]: {},
    };
    const transformFn = (preprocessMap[tpId] || {})[objType];
    return transformFn ? transformFn(obj) : obj;
};
