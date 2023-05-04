export interface UnifiedDeal {
    amount: Number;
    priority: string;
    stage: string;
    name?: string;
    expectedCloseDate: Date;
    isWon: boolean;
    probability: Number;
    id: string;
    remoteId: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: any; // TODO: Support associations
    additional?: any; // TODO: Handle additional fields
}

export function unifyDeal(deal: any): UnifiedDeal {
    const unifiedDeal: UnifiedDeal = {
        remoteId: deal.id || deal.dealID || deal.deal_id,
        id: deal.id || deal.dealID || deal.deal_id,
        createdTimestamp: deal.createdDate || deal.CreatedDate || deal.Created_Time,
        updatedTimestamp: deal.lastModifiedDate || deal.LastModifiedDate || deal.Modified_Time,
        amount: deal.amount || deal.Amount,
        priority: deal.priority || deal.Priority,
        stage: deal.stage || deal.Stage || deal.dealstage,
        expectedCloseDate: deal.closedate || deal.CloseDate || deal.Close_Date || deal.Closing_Date,
        isWon: deal.hs_is_closed_won,
        probability: deal.hs_deal_stage_probability || deal.Probability,
    };

    // Map additional fields
    Object.keys(deal).forEach((key) => {
        if (!(key in unifiedDeal)) {
            unifiedDeal['additional'][key] = deal[key];
        }
    });

    return unifiedDeal;
}

export function toSalesforceDeal(unifiedDeal: UnifiedDeal): any {
    const salesforceCompany: any = {
        Id: unifiedDeal.remoteId,
        Amount: unifiedDeal.amount,
        Name: unifiedDeal.name,
        Probability: unifiedDeal.probability,
        IsWon: unifiedDeal.isWon,
        StageName: unifiedDeal.stage,
        CloseDate: unifiedDeal.expectedCloseDate,
        Priority__c: unifiedDeal.priority,
    };

    // Map custom fields
    if (unifiedDeal.additional) {
        Object.keys(unifiedDeal.additional).forEach((key) => {
            salesforceCompany[key] = unifiedDeal.additional?.[key];
        });
    }
    return salesforceCompany;
}

export function toZohoDeal(unified: UnifiedDeal): any {
    const zoho: any = {};
    zoho.Amount = unified.amount;
    zoho.id = unified.remoteId;
    zoho.Deal_Name = unified.name;
    zoho.Priority = unified.priority;
    zoho.Stage = unified.stage;
    zoho.closedate = unified.expectedCloseDate;
    zoho.Probability = unified.probability;

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            zoho[key] = unified.additional?.[key];
        });
    }
    return zoho;
}

export function toHubspotDeal(unifiedDeal: UnifiedDeal): any {
    const hubspotDeal: any = {
        hs_object_id: unifiedDeal.remoteId,
        hs_forecast_amount: unifiedDeal.amount,
        firstname: unifiedDeal.name?.split(' ')[0],
        lastname: unifiedDeal.name?.split(' ')[1],
        hs_priority: unifiedDeal.priority,
        dealstage: unifiedDeal.stage,
        closedate: unifiedDeal.expectedCloseDate,
        hs_deal_stage_probability: unifiedDeal.probability,
        dealname: unifiedDeal.name,
    };

    // Map custom fields
    if (unifiedDeal.additional) {
        Object.keys(unifiedDeal.additional).forEach((key) => {
            hubspotDeal[key] = unifiedDeal.additional?.[key];
        });
    }

    return hubspotDeal;
}

export function disunifyDeal(deal: UnifiedDeal, integrationId: string): any {
    if (integrationId === 'sfdc') {
        return toSalesforceDeal(deal);
    } else if (integrationId === 'hubspot') {
        return toHubspotDeal(deal);
    } else if (integrationId === 'zohocrm') {
        return toZohoDeal(deal);
    }
}
