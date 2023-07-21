import axios from 'axios';
import { UnifiedDeal, disunifyDeal, unifyDeal } from '../models/unified';
import { TP_ID, connections } from '@prisma/client';
import { PipedrivePagination } from '../constants/pipedrive';
import { NotFoundError } from '../generated/typescript/api/resources/common';

class DealService {
    async getUnifiedDeal({
        connection,
        dealId,
        fields,
    }: {
        connection: connections;
        dealId: string;
        fields?: string;
    }): Promise<{
        status: 'ok';
        result: UnifiedDeal;
    }> {
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        console.log('Revert::GET DEAL', tenantId, thirdPartyId, thirdPartyToken, dealId);
        if (thirdPartyId === 'hubspot') {
            const formattedFields = [
                ...String(fields || '').split(','),
                'dealname',
                'amount',
                'dealstage',
                'hs_priority',
                'hs_deal_stage_probability',
                'closedate',
                'hs_is_closed_won',
            ];
            let deal: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/deals/${dealId}?properties=${formattedFields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            deal = ([deal.data] as any[])?.[0];
            deal = unifyDeal({ ...deal, ...deal?.properties }, thirdPartyId);
            return { status: 'ok', result: deal };
        } else if (thirdPartyId === 'zohocrm') {
            const deals = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Deals/${dealId}?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            let deal = unifyDeal(deals.data.data?.[0], thirdPartyId);
            return { status: 'ok', result: deal };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            const deals = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/sobjects/Opportunity/${dealId}`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            let deal = unifyDeal(deals.data, thirdPartyId);
            return { status: 'ok', result: deal };
        } else {
            throw new NotFoundError({ error: 'Unrecognized CRM' });
        }
    }
    async getUnifiedDeals({
        connection,
        fields,
        pageSize,
        cursor,
    }: {
        connection: connections;
        fields?: string;
        pageSize?: number;
        cursor?: string;
    }): Promise<{
        status: 'ok';
        next?: string;
        previous?: string;
        results: UnifiedDeal[];
    }> {
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;

        console.log('Revert::GET ALL DEAL', tenantId, thirdPartyId, thirdPartyToken);
        if (thirdPartyId === 'hubspot') {
            const formattedFields = [
                ...String(fields || '').split(','),
                'dealname',
                'amount',
                'dealstage',
                'hs_priority',
                'hs_deal_stage_probability',
                'closedate',
                'hs_is_closed_won',
            ];
            const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${cursor ? `&after=${cursor}` : ''}`;
            let deals: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/deals?properties=${formattedFields}&${pagingString}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            const nextCursor = deals.data?.paging?.next?.after || undefined;
            deals = deals.data.results as any[];
            deals = deals?.map((l: any) => unifyDeal({ ...l, ...l?.properties }, thirdPartyId));
            return {
                status: 'ok',
                next: nextCursor,
                previous: undefined, // Field not supported by Hubspot.
                results: deals,
            };
        } else if (thirdPartyId === 'zohocrm') {
            const pagingString = `${pageSize ? `&per_page=${pageSize}` : ''}${cursor ? `&page_token=${cursor}` : ''}`;
            let deals: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Deals?fields=${fields}${pagingString}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            const nextCursor = deals.data?.info?.next_page_token || undefined;
            const prevCursor = deals.data?.info?.previous_page_token || undefined;
            deals = deals.data.data;
            deals = deals?.map((l: any) => unifyDeal(l, thirdPartyId));
            return { status: 'ok', next: nextCursor, previous: prevCursor, results: deals };
        } else if (thirdPartyId === 'sfdc') {
            let pagingString = `${pageSize ? `ORDER+BY+Id+DESC+LIMIT+${pageSize}+` : ''}${
                cursor ? `OFFSET+${cursor}` : ''
            }`;
            if (!pageSize && !cursor) {
                pagingString = 'LIMIT 200';
            }
            const instanceUrl = connection.tp_account_url;
            // TODO: Handle "ALL" for Hubspot & Zoho
            const query =
                !fields || fields === 'ALL'
                    ? `SELECT+fields(all)+from+Opportunity+${pagingString}`
                    : `SELECT+${(fields as string).split(',').join('+,+')}+from+Opportunity+${pagingString}`;
            let deals: any = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/query/?q=${query}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            const nextCursor = pageSize ? String(deals.data?.totalSize + (parseInt(String(cursor)) || 0)) : undefined;
            const prevCursor =
                cursor && parseInt(String(cursor)) > 0
                    ? String(parseInt(String(cursor)) - deals.data?.totalSize)
                    : undefined;
            deals = deals.data?.records;
            deals = deals?.map((l: any) => unifyDeal(l, thirdPartyId));
            return { status: 'ok', next: nextCursor, previous: prevCursor, results: deals };
        } else {
            throw new NotFoundError({ error: 'Unrecognised CRM' });
        }
    }
    async searchUnifiedDeals({
        connection,
        searchCriteria,
        fields,
    }: {
        connection: connections;
        searchCriteria: any;
        fields?: string;
    }): Promise<{
        status: 'ok';
        results: UnifiedDeal[];
    }> {
        const formattedFields = (fields || '').split('').filter(Boolean);
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        console.log('Revert::SEARCH DEAL', tenantId, searchCriteria, fields);

        switch (thirdPartyId) {
            case TP_ID.hubspot: {
                let deals: any = await axios({
                    method: 'post',
                    url: `https://api.hubapi.com/crm/v3/objects/deals/search`,
                    headers: {
                        'content-type': 'application/json',
                        authorization: `Bearer ${thirdPartyToken}`,
                    },
                    data: JSON.stringify({
                        ...searchCriteria,
                        properties: [
                            'hs_deal_status',
                            'firstname',
                            'email',
                            'lastname',
                            'hs_object_id',
                            'dealname',
                            'amount',
                            'dealstage',
                            'hs_priority',
                            'hs_deal_stage_probability',
                            'closedate',
                            'hs_is_closed_won',
                            ...formattedFields,
                        ],
                    }),
                });
                deals = deals.data.results as any[];
                deals = deals?.map((l: any) => unifyDeal({ ...l, ...l?.properties }, thirdPartyId));
                return { status: 'ok', results: deals };
            }
            case TP_ID.zohocrm: {
                let deals: any = await axios({
                    method: 'get',
                    url: `https://www.zohoapis.com/crm/v3/deals/search?criteria=${searchCriteria}`,
                    headers: {
                        authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                    },
                });
                deals = deals.data.data;
                deals = deals?.map((l: any) => unifyDeal(l, thirdPartyId));
                return { status: 'ok', results: deals };
            }
            case TP_ID.sfdc: {
                const instanceUrl = connection.tp_account_url;
                let deals: any = await axios({
                    method: 'get',
                    url: `${instanceUrl}/services/data/v56.0/search?q=${searchCriteria}`,
                    headers: {
                        authorization: `Bearer ${thirdPartyToken}`,
                    },
                });
                deals = deals?.data?.searchRecords;
                deals = deals?.map((l: any) => unifyDeal(l, thirdPartyId));
                return { status: 'ok', results: deals };
            }
            case TP_ID.pipedrive: {
                const instanceUrl = connection.tp_account_url;
                const result = await axios.get<
                    { data: { items: { item: any; result_score: number }[] } } & PipedrivePagination
                >(
                    `${instanceUrl}/v1/deals/search?term=${searchCriteria}${
                        formattedFields.length ? `&fields=${formattedFields.join(',')}` : ''
                    }`,
                    {
                        headers: {
                            Authorization: `Bearer ${thirdPartyToken}`,
                        },
                    }
                );
                const deals = result.data.data.items.map((item) => item.item);
                const unifiedDeals = deals?.map((d: any) => unifyDeal(d, thirdPartyId));
                return { status: 'ok', results: unifiedDeals };
            }
            default: {
                throw new NotFoundError({ error: 'Unrecognised CRM' });
            }
        }
    }
    async createDeal({ connection, dealData }: { dealData: UnifiedDeal; connection: connections }): Promise<{
        status: 'ok';
        result: any;
        message: string;
    }> {
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const deal = disunifyDeal(dealData, thirdPartyId);
        console.log('Revert::CREATE DEAL', tenantId, deal);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/deals/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(deal),
            });
            return {
                status: 'ok',
                message: 'Hubspot deal created',
                result: deal,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'post',
                url: `https://www.zohoapis.com/crm/v3/Deals`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(deal),
            });
            return { status: 'ok', message: 'Zoho deal created', result: deal };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            const dealCreated = await axios({
                method: 'post',
                url: `${instanceUrl}/services/data/v56.0/sobjects/Opportunity/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(deal),
            });
            return {
                status: 'ok',
                message: 'SFDC deal created',
                result: dealCreated.data,
            };
        } else {
            throw new NotFoundError({ error: 'Unrecognised CRM' });
        }
    }
    async updateDeal({
        connection,
        dealData,
        dealId,
    }: {
        dealData: UnifiedDeal;
        connection: connections;
        dealId: string;
    }): Promise<{
        status: 'ok';
        result: any;
        message: string;
    }> {
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const deal = disunifyDeal(dealData, thirdPartyId);
        console.log('Revert::UPDATE DEAL', tenantId, deal, dealId);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'patch',
                url: `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(deal),
            });
            return {
                status: 'ok',
                message: 'Hubspot deal updated',
                result: deal,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'put',
                url: `https://www.zohoapis.com/crm/v3/Deals/${dealId}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(deal),
            });
            return { status: 'ok', message: 'Zoho deal updated', result: deal };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            await axios({
                method: 'patch',
                url: `${instanceUrl}/services/data/v56.0/sobjects/Opportunity/${dealId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(deal),
            });
            return { status: 'ok', message: 'SFDC deal updated', result: deal };
        } else {
            throw new NotFoundError({ error: 'Unrecognised CRM' });
        }
    }
}

export default new DealService();
