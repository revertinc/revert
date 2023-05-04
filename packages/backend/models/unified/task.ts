export interface UnifiedTask {
    subject: string;
    body: string;
    priority: string;
    status: string;
    dueDate: Date;
    id: string;
    remoteId: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: any; // TODO: Support associations
    additional?: any; // TODO: Handle additional fields
}

export function unifyTask(task: any): UnifiedTask {
    const unifiedTask: UnifiedTask = {
        remoteId: task.id || task.Id,
        id: task.id || task.Id,
        createdTimestamp: task.createdDate || task.CreatedDate || task.Created_Time || task.hs_timestamp,
        updatedTimestamp: task.lastModifiedDate || task.LastModifiedDate || task.Modified_Time,
        body: task.Description || task.description || task.hs_task_body,
        subject: task.hs_task_subject || task.Subject,
        priority: task.priority || task.Priority || task.hs_task_priority,
        status: task.status || task.Status || task.hs_task_status,
        dueDate: task.hs_timestamp || task.Due_Date || task.ActivityDate,
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
    const zoho: any = {};
    zoho.id = unified.remoteId;
    zoho.Description = unified.body;
    zoho.Subject = unified.subject;
    zoho.Priority = unified.priority;
    zoho.Status = unified.status;
    zoho.Due_Date = unified.dueDate;

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            zoho[key] = unified.additional?.[key];
        });
    }
    return zoho;
}

export function toHubspotTask(unified: UnifiedTask): any {
    const hubspotTask: any = {
        hs_object_id: unified.remoteId,
        hs_task_body: unified.body,
        hs_task_subject: unified.subject,
        hs_task_priority: unified.priority,
        hs_task_status: unified.status,
        hs_timestamp: unified.dueDate,
    };

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            hubspotTask[key] = unified.additional?.[key];
        });
    }

    return hubspotTask;
}

export function disunifyTask(task: UnifiedTask, integrationId: string): any {
    if (integrationId === 'sfdc') {
        return toSalesforceTask(task);
    } else if (integrationId === 'hubspot') {
        return toHubspotTask(task);
    } else if (integrationId === 'zohocrm') {
        return toZohoTask(task);
    }
}
