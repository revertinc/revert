export interface UnifiedTicketTask {
    id: string;
    remoteId: string;
    name: string;
    assignees: Object[];
    description: string;
    creatorId: string;
    createdTimeStamp: string;
    updatedTimeStamp: string;
    dueDate: string;
    completedDate: string;
    additional: any;
    associations: any;
}
