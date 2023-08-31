import { Subtype } from '../../constants/typeHelpers';
import { AllAssociation } from '../../constants/common';

export type NoteAssociation = Subtype<AllAssociation, 'contactId' | 'companyId' | 'leadId' | 'dealId'>;

export interface UnifiedNote {
    content: string;
    id: string;
    remoteId: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: {
        [x in NoteAssociation]?: string;
    };
    additional: any;
}
