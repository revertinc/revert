import { CompanyAssociation } from "../../constants/associations";

export interface UnifiedCompany {
    name: string;
    industry: string; // not supported by pipedrive
    description: string; // not supported by pipedrive
    annualRevenue: number; // not supported by pipedrive
    size: number;
    phone: string; // not supported by pipedrive
    address: {
        street: string; // Note: No street field in Hubspot.
        city: string;
        state: string;
        country: string;
        zip: string;
        postalCode: string;
    };
    id: string;
    remoteId: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: {
        [x in CompanyAssociation]?: string;
    };
    additional: any;
}
