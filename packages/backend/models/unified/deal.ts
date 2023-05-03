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
