import { UserAssociation } from '../../constants/associations';

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
