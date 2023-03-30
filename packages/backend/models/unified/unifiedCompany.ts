export interface UnifiedCompany {
    id?: string;
    name?: string;
    description?: string;
    website?: string;
    phone?: string;
    industry?: string;
    annualRevenue?: number;
    numberOfEmployees?: number;
    tickerSymbol?: string;
    type?: string;
    parentCompanyId?: string;
    isPublic?: boolean;
    foundedYear?: number;
    timeZone?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        postalCode?: string;
        country: string;
    };
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    facebookPage?: string;
    twitterUsername?: string;
    linkedinPage?: string;
    googlePlusPage?: string;
    numAssociations?: number;
    hsNumAssociatedContacts?: number;
    hsNumAssociatedDeals?: number;
    hsLastActivityDate?: Date;
    hsLastContacted?: Date;
    hsLifecycleStage?: string;
    hsDealAmount?: number;
    hsDealCloseDate?: Date;
    hsLastMeetingBooked?: Date;
    hsLastMeetingBookedCampaign?: string;
    hsLastMeetingBookedMedium?: string;
    hsLastMeetingBookedSource?: string;
    hsSalesEmailLastReplied?: Date;
    sfIndustry?: string;
    sfNumberOfEmployees?: number;
    sfType?: string;
    sfTickerSymbol?: string;
    sfParentCompanyId?: string;
    zohoOwner?: string;
    zohoLastActivityTime?: Date;
    zohoLastModifiedTime?: Date;
    zohoNumActivities?: number;
    zohoNumNotes?: number;
    zohoOwnerID?: string;
    zohoParentCompanyId?: string;
    hubspotOwnerId?: string;
    hubspotFirstDealCreatedDate?: Date;
    hubspotLastModifiedDate?: Date;
    hubspotNumBlockers?: number;
    hubspotNumContacts?: number;
    hubspotNumDecisionMakers?: number;
    hubspotNumOpenDeals?: number;
    hubspotTotalDealValue?: number;
}

export function unifyCompany(company: any): UnifiedCompany {
    if (!company) return company;
    const unifiedCompanyObj = {
        id: company.id || company.Company_Id || company.company_id,
        name: company.name || company.Company_Name || company.company_name || company.Name || company.Account_Name,
        website: company.website || company.Website || company.website,
        phone: company.phone || company.Phone || company.phone,
        address: {
            street: company.street || company.Address || company.address,
            city: company.city || company.City || company.city,
            state: company.state || company.State || company.state,
            country: company.country || company.Country || company.country,
            zip: company.zip || company.Zip || company.zip,
        },
        industry: company.industry || company.Industry || company.industry,
        size: company.size || company.Size || company.size,
        owner: company.owner || company.Owner || company.owner,
        createdDate: company.createdDate || company.Created_Date || company.created_date,
        modifiedDate: company.modifiedDate || company.Modified_Date || company.modified_date,
    };

    return unifiedCompanyObj;
}
