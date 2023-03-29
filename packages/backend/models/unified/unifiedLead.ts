export interface UnifiedLead {
    id: string;
    owner?: string;
    company?: string;
    name?: string;
    firstName?: string;
    salutation?: string;
    lastName?: string;
    fullName?: string;
    designation?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    fax?: string;
    leadSource?: string;
    website?: string;
    annualRevenue?: number;
    leadStatus?: string;
    industry?: string;
    emailOptOut?: boolean;
    numberOfEmployees?: number;
    modifiedBy?: string;
    rating?: string;
    exchangeRate?: number;
    createdBy?: string;
    skypeId?: string;
    secondaryEmail?: string;
    twitter?: string;
    modifiedTime?: Date;
    currency?: string;
    tag?: string[];
    lastActivityTime?: Date;
    createdTime?: Date;
    unsubscribedMode?: boolean;
    convertedAccount?: string;
    leadConversionTime?: Date;
    convertedDeal?: string;
    unsubscribedTime?: Date;
    dataProcessingBasisDetails?: string;
    convertedContact?: string;
    dataSource?: string;
    dataProcessingBasis?: string;
    wizard?: boolean;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    description?: string;
    recordImage?: string;
    alternateAddress?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    status?: string;
    tags?: string;
    social?: {
        twitter: string;
        linkedin: string;
        facebook: string;
    };
    customFields?: any;
}

export function unifyLead(lead: any): UnifiedLead {
    return {
        id: lead.id || lead.Id || lead.vid,
        name: lead.Name,
        firstName: lead.firstName || lead.First_Name || lead.FirstName,
        lastName: lead.lastName || lead.Last_Name || lead.LastName,
        email: lead.email || lead.Email,
        phone: lead.phone || lead.Phone || lead.PhoneNumber,
        company: lead.company || lead.Company,
        website: lead.website || lead.Website,
        address: {
            street: lead.street || lead.Street || lead.Address,
            city: lead.city || lead.City,
            state:
                lead.state ||
                lead.State ||
                lead.province ||
                lead.Province ||
                lead.StateCode ||
                lead.State_Code ||
                lead.StateCode__c,
            postalCode: lead.postalCode || lead.Zip_Code || lead.PostalCode,
            country: lead.country || lead.Country || lead.CountryCode || lead.Country_Code || lead.Country__c,
        },
        leadSource: lead.leadSource || lead.Lead_Source || lead.utm_source || lead.Original_Source_Type__c,
        status: lead.status || lead.Lead_Status || lead.lead_status || lead.Status__c,
        industry: lead.industry || lead.Industry || lead.Industry__c,
        rating: lead.rating || lead.Rating,
        owner: lead.owner || lead.Owner || lead.ownerId || lead.OwnerId,
        createdBy: lead.createdBy || lead.Created_By || lead.CreatedById,
        createdTime: lead.createdTime || lead.Created_Time || lead.created_at,
        modifiedBy: lead.modifiedBy || lead.Modified_By || lead.ModifiedById,
        modifiedTime: lead.modifiedTime || lead.Modified_Time || lead.updated_at,
        description: lead.description || lead.Description,
        tags: lead.tags || lead.Tag?.split(',') || lead.tags,
        social: {
            twitter: lead.twitter || lead.Twitter_Handle__c,
            linkedin: lead.linkedin || lead.LinkedIn_Profile_URL__c,
            facebook: lead.facebook || lead.Facebook_Profile_URL__c,
        },
        customFields: {
            annualRevenue: lead.annualRevenue || lead.Annual_Revenue || lead.AnnualRevenue,
            designation: lead.designation || lead.Designation || lead.Job_Title__c,
        },
    };
}
