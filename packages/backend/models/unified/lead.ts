import { LeadAssociation } from '../../constants/associations';

export interface UnifiedLead {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    id: string;
    remoteId: string; // TODO: Make this unique.
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: {
        [x in LeadAssociation]?: string;
    };
    additional: any;
    // QUESTION: Add value of lead and expected close date here?
}
