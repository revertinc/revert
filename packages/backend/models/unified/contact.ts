import { Subtype } from '../../constants/typeHelpers';
import { AllAssociation } from '../../constants/common';

export type ContactAssociation = Subtype<AllAssociation, 'dealId'>;

export interface UnifiedContact {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    id: string;
    remoteId: string; // TODO: Make this unique.
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: {
        [x in ContactAssociation]?: string;
    };
    additional: any;
}

// To determine if a field is a user defined custom field using the properties API:
// Hubspot: `hubspotDefined` is false and calculated is false
// ZohoCRM: `custom_field` is true
// SFDC: `custom` is true.
