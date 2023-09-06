import { AllAssociation } from '../../constants/common';
import { Subtype } from '../../constants/typeHelpers';

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
