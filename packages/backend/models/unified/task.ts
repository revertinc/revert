import { TP_ID } from '@prisma/client';
import { AllAssociation } from '../../constants/common';
import { Subtype } from '../../constants/typehelpers';
import { getHubspotAssociationObj } from '../../helpers/hubspot';

export type TaskAssociation = Subtype<AllAssociation, 'dealId'>;

export interface UnifiedTask {
    subject: string;
    body: string;
    priority: string; // not available in pipedrive
    status: string;
    dueDate: Date;
    id: string;
    remoteId: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: {
        [x in TaskAssociation]?: string;
    };
    additional: any;
}

export function unifyTask(task: any): UnifiedTask {
    const unifiedTask: UnifiedTask = {
        remoteId: task.id || task.Id,
        id: task.id || task.Id,
        createdTimestamp:
            task.createdDate ||
            task.CreatedDate ||
            task.Created_Time ||
            task.hs_timestamp ||
            task.hs_createdate ||
            task.add_time,
        updatedTimestamp:
            task.lastModifiedDate ||
            task.LastModifiedDate ||
            task.Modified_Time ||
            task.hs_lastmodifieddate ||
            task.update_time,
        body: task.Description || task.description || task.hs_task_body || task.public_description,
        subject: task.hs_task_subject || task.Subject || task.subject,
        priority: task.priority || task.Priority || task.hs_task_priority,
        status: task.status || task.Status || task.hs_task_status || task.done ? 'done' : '',
        dueDate: task.hs_timestamp || task.Due_Date || task.ActivityDate || task.due_date,
        additional: {},
    };

    // Map additional fields
    Object.keys(task).forEach((key) => {
        if (!(key in unifiedTask)) {
            unifiedTask['additional'][key] = task[key];
        }
    });

    return unifiedTask;
}

export function toSalesforceTask(unified: UnifiedTask): any {
    const salesforce: any = {
        Id: unified.remoteId,
        Description: unified.body,
        Subject: unified.subject,
        Priority: unified.priority,
        Status: unified.status,
        ActivityDate: unified.dueDate,
    };

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            salesforce[key] = unified.additional?.[key];
        });
    }
    return salesforce;
}

export function toZohoTask(unified: UnifiedTask): any {
    const zoho: any = {
        data: [{}],
        apply_feature_execution: [
            {
                name: 'layout_rules',
            },
        ],
        trigger: ['approval', 'workflow', 'blueprint'],
    };
    zoho.data[0].id = unified.remoteId;
    zoho.data[0].Description = unified.body;
    zoho.data[0].Subject = unified.subject;
    zoho.data[0].Priority = unified.priority;
    zoho.data[0].Status = unified.status;
    zoho.data[0].Due_Date = unified.dueDate; // TODO: Unify format

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            zoho.data[0][key] = unified.additional?.[key];
        });
    }
    return zoho;
}

export function toHubspotTask(unified: UnifiedTask): any {
    const hubspotTask: any = {
        properties: {
            id: unified.remoteId,
            hs_task_body: unified.body,
            hs_task_subject: unified.subject,
            hs_task_priority: unified.priority,
            hs_task_status: unified.status,
            hs_timestamp: Date.now().toString(),
        },
    };

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            hubspotTask['properties'][key] = unified.additional?.[key];
        });
    }
    if (unified.associations) {
        const associationObj = unified.associations;
        const associationArr = Object.keys(associationObj).map((key) => {
            return {
                to: {
                    id: associationObj[key as TaskAssociation],
                },
                types: [getHubspotAssociationObj(key as TaskAssociation, 'task')],
            };
        });
        hubspotTask['associations'] = associationArr;
    }

    return hubspotTask;
}

export function toPipedriveTask(unifiedEvent: UnifiedTask): any {
    const pipedriveEvent: any = {
        id: unifiedEvent.remoteId,
        type: 'task',
        subject: unifiedEvent.subject,
        public_description: unifiedEvent.body,
        due_date: unifiedEvent.dueDate ? `${unifiedEvent.dueDate}` : undefined,
        done: unifiedEvent.status === 'done',
    };

    // Map custom fields
    if (unifiedEvent.additional) {
        Object.keys(unifiedEvent.additional).forEach((key) => {
            pipedriveEvent[key] = unifiedEvent.additional?.[key];
        });
    }

    return pipedriveEvent;
}

export function disunifyTask(task: UnifiedTask, integrationId: string): any {
    if (integrationId === TP_ID.sfdc) {
        return toSalesforceTask(task);
    } else if (integrationId === TP_ID.hubspot) {
        return toHubspotTask(task);
    } else if (integrationId === TP_ID.zohocrm) {
        return toZohoTask(task);
    } else if (integrationId === TP_ID.pipedrive) {
        return toPipedriveTask(task);
    }
}
