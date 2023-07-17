import { TP_ID } from '@prisma/client';
import { PipedriveDealStatus } from '../../constants/pipedrive';

export type DealAssociation = 'personId' | 'organizationId';

export interface UnifiedDeal {
    amount: Number;
    priority: string; // not available for pipedrive
    stage: string;
    name: string;
    expectedCloseDate: Date; // not available for pipedrive search
    isWon: boolean;
    probability: Number;
    id: string;
    remoteId: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: {
        [x in DealAssociation]?: string;
    };
    additional: any;
}

export function unifyDeal(deal: any, tpId: TP_ID): UnifiedDeal {
    const unifiedDeal: UnifiedDeal = {
        remoteId: deal.id || deal.dealID || deal.deal_id || deal.Id,
        id: deal.id || deal.dealID || deal.deal_id || deal.Id,
        name: deal.dealname || deal.Name || deal.Deal_Name || deal.title,
        createdTimestamp: deal.createdDate || deal.CreatedDate || deal.Created_Time || deal.createdate || deal.add_time,
        updatedTimestamp:
            deal.lastModifiedDate ||
            deal.LastModifiedDate ||
            deal.Modified_Time ||
            deal.hs_lastmodifieddate ||
            deal.update_time,
        amount: deal.amount || deal.Amount || deal.value,
        priority: deal.priority || deal.Priority || deal.hs_priority || deal.Priority__c, // Note: `Priority__c` may not be present in every SFDC instance
        stage: deal.stage?.name || deal.stage || deal.Stage || deal.dealstage || deal.StageName || deal.stage_id,
        expectedCloseDate: deal.closedate || deal.CloseDate || deal.Close_Date || deal.Closing_Date || deal.close_time,
        isWon:
            deal.hs_is_closed_won ||
            deal.isWon ||
            deal.Stage === 'Closed (Won)' ||
            deal.status === PipedriveDealStatus.won,
        probability: deal.hs_deal_stage_probability || deal.Probability || deal.probability,
        additional: {},
        associations: {
            ...(tpId === TP_ID.pipedrive && {
                personId: deal.person_id || deal.person?.id,
                organizationId: deal.organization_id || deal.organization?.id,
            }),
        },
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
    const zoho: any = {
        data: [{}],
        apply_feature_execution: [
            {
                name: 'layout_rules',
            },
        ],
        trigger: ['approval', 'workflow', 'blueprint'],
    };
    zoho.data[0].Amount = unified.amount;
    zoho.data[0].id = unified.remoteId;
    zoho.data[0].Deal_Name = unified.name;
    zoho.data[0].Priority = unified.priority;
    zoho.data[0].Stage = unified.stage;
    zoho.data[0].closedate = unified.expectedCloseDate;
    zoho.data[0].Probability = Number(unified.probability) * 100;

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            zoho.data[0][key] = unified.additional?.[key];
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

export function toPipedriveDeal(unifiedDeal: UnifiedDeal): any {
    const pipedriveDeal: any = {
        id: unifiedDeal.remoteId,
        value: unifiedDeal.amount,
        stage_id: unifiedDeal.stage,
        close_time: unifiedDeal.expectedCloseDate,
        probability: unifiedDeal.probability,
        title: unifiedDeal.name,
        status: unifiedDeal.isWon ? PipedriveDealStatus.won : PipedriveDealStatus.open,
        add_time: unifiedDeal.createdTimestamp,
        update_time: unifiedDeal.updatedTimestamp,
        ...(unifiedDeal.associations?.personId && {
            person_id: unifiedDeal.associations.personId,
        }),
        ...(unifiedDeal.associations?.organizationId && {
            org_id: unifiedDeal.associations.organizationId,
        }),
    };

    // Map custom fields
    if (unifiedDeal.additional) {
        Object.keys(unifiedDeal.additional).forEach((key) => {
            pipedriveDeal[key] = unifiedDeal.additional?.[key];
        });
    }

    return pipedriveDeal;
}

export function disunifyDeal(deal: UnifiedDeal, integrationId: string): any {
    if (integrationId === TP_ID.sfdc) {
        return toSalesforceDeal(deal);
    } else if (integrationId === TP_ID.hubspot) {
        return toHubspotDeal(deal);
    } else if (integrationId === TP_ID.zohocrm) {
        return toZohoDeal(deal);
    } else if (integrationId === TP_ID.pipedrive) {
        return toPipedriveDeal(deal);
    }
}
