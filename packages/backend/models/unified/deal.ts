import { Subtype } from '../../constants/typeHelpers';
import { AllAssociation } from '../../constants/common';

export type DealAssociation = Subtype<AllAssociation, 'contactId' | 'companyId'>;

export interface UnifiedDeal {
    amount: number;
    priority: string; // not available for pipedrive
    stage: string;
    name: string;
    expectedCloseDate: Date; // not available for pipedrive search
    isWon: boolean;
    probability: number;
    id: string;
    remoteId: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: {
        [x in DealAssociation]?: string;
    };
    additional: any;
}
