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
