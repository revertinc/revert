export interface UnifiedDeal {
    amount: Number;
    priority: string;
    stage: string;
    name: string;
    expectedCloseDate: Date;
    isWon: boolean;
    probability: Number;
    id: string;
    remoteId: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: any; // TODO: Support associations
    additional: any;
}

export function unifyDeal(deal: any): UnifiedDeal {
    const unifiedDeal: UnifiedDeal = {
        remoteId: deal.id || deal.dealID || deal.deal_id || deal.Id,
        id: deal.id || deal.dealID || deal.deal_id || deal.Id,
        name: deal.dealname || deal.Name || deal.Deal_Name,
        createdTimestamp: deal.createdDate || deal.CreatedDate || deal.Created_Time || deal.createdate,
        updatedTimestamp:
            deal.lastModifiedDate || deal.LastModifiedDate || deal.Modified_Time || deal.hs_lastmodifieddate,
        amount: deal.amount || deal.Amount,
        priority: deal.priority || deal.Priority || deal.hs_priority || deal.Priority__c, // Note: `Priority__c` may not be present in every SFDC instance
        stage: deal.stage || deal.Stage || deal.dealstage || deal.StageName,
        expectedCloseDate: deal.closedate || deal.CloseDate || deal.Close_Date || deal.Closing_Date,
        isWon: deal.hs_is_closed_won || deal.isWon || deal.Stage === 'Closed (Won)',
        probability: deal.hs_deal_stage_probability || deal.Probability,
        additional: {},
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
        Probability: String(Number(unifiedDeal.probability) * 100),
        IsWon: unifiedDeal.isWon,
        StageName: unifiedDeal.stage,
        CloseDate: unifiedDeal.expectedCloseDate,
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
        properties: {
            id: unifiedDeal.remoteId,
            amount: unifiedDeal.amount,
            hs_priority: unifiedDeal.priority,
            dealstage: unifiedDeal.stage,
            closedate: unifiedDeal.expectedCloseDate,
            hs_deal_stage_probability: unifiedDeal.probability,
            dealname: unifiedDeal.name,
        },
    };

    // Map custom fields
    if (unifiedDeal.additional) {
        Object.keys(unifiedDeal.additional).forEach((key) => {
            hubspotDeal['properties'][key] = unifiedDeal.additional?.[key];
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
