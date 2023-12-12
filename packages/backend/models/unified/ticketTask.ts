import { TP_ID } from '@prisma/client';

export interface UnifiedTicketTask {
    id: string;
    name: string;
    assignees: Object[];
    description: string;
    createdBy: string;
    createdTimeStamp: string;
    updatedTimeStamp: string;
    dueDate: string;
    completedDate: string;
    additional: any;
}

export function unifyTicketTask(task: any, thirdPartyId: any): UnifiedTicketTask {
    switch (thirdPartyId) {
        case TP_ID.linear: {
            const unifiedTask: UnifiedTicketTask = {
                id: String(task.id),
                name: task.title,
                assignees: task.assignee,
                description: task.description,
                createdBy: task.creator,
                createdTimeStamp: task.createdAt,
                updatedTimeStamp: task.updatedAt,
                dueDate: task.dueDate,
                completedDate: task.completedDate,
                additional: task,
            };
            return unifiedTask;
        }
        case TP_ID.clickup: {
            const unifiedTask: UnifiedTicketTask = {
                id: task.id,
                name: task.name,
                assignees: task.assignees,
                description: task.description,
                createdBy: task.creator.id,
                createdTimeStamp: task.date_created,
                updatedTimeStamp: task.date_updated,
                dueDate: task.due_date,
                completedDate: task.date_done,
                additional: task,
            };

            return unifiedTask;
        }

        default: {
            throw new Error('Ticketing app not found');
        }
    }
}

export function disunifyTicketTask(task: any, thirdPartyId: any) {
    switch (thirdPartyId) {
        case TP_ID.linear: {
            const disUnifiedTask: any = {
                title: task.name,
                description: task.description,
                assigneeId: task.assignees[0],
                dueDate: task.dueDate,
            };
            if (task.associations) {
                Object.keys(task.associations).forEach((key) => {
                    disUnifiedTask[key] = task.associations[key];
                });
            }

            return disUnifiedTask;
        }
        case TP_ID.clickup: {
            let dueDate_int = undefined;
            if (task.dueDate) {
                dueDate_int = new Date(task.dueDate).getTime();
            }

            const disUnifiedTask: any = {
                name: task.name,
                description: task.description,
                assignees: task.assignees,
                due_date: dueDate_int,
                additional: task.additional,
            };

            if (task.associations) {
                Object.keys(task.associations).forEach((key) => {
                    disUnifiedTask[key] = task.associations[key];
                });
            }

            return disUnifiedTask;
        }
        default: {
            throw new Error('Ticketing app not found');
        }
    }
}
