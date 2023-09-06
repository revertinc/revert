import { AllAssociation } from '../../constants/common';
import { Subtype } from '../../constants/typeHelpers';

export type LeadAssociation = Subtype<AllAssociation, 'contactId' | 'companyId' | 'dealId'>;

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
