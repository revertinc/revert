import { AllAssociation } from '../../constants/common';
import { Subtype } from '../../constants/typeHelpers';

export type UserAssociation = Subtype<AllAssociation, 'dealId'>;

export interface UnifiedUser {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    id: string;
    remoteId: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: {
        [x in UserAssociation]?: string;
    };
    additional: any;
}
