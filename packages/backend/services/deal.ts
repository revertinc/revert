import axios from 'axios';
import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { disunifyDeal, unifyDeal } from '../models/unified';
import { ParsedQs } from 'qs';
import { TP_ID } from '@prisma/client';
import { PipedrivePagination } from 'constants/pipedrive';

class DealService {
    async getUnifiedDeal(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const dealId = req.params.id;
        let fields = req.query.fields;
        console.log('Revert::GET DEAL', tenantId, thirdPartyId, thirdPartyToken, dealId);
        if (thirdPartyId === 'hubspot') {
            fields = [
                ...String(req.query.fields || '').split(','),
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
                url: `https://api.hubapi.com/crm/v3/objects/deals/${dealId}?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            deal = ([deal.data] as any[])?.[0];
            deal = unifyDeal({ ...deal, ...deal?.properties });
            return {
                result: deal,
            };
        } else if (thirdPartyId === 'zohocrm') {
            const deals = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Deals/${dealId}?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            let deal = unifyDeal(deals.data.data?.[0]);
            return { result: deal };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            const deals = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/sobjects/Opportunity/${dealId}`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            let deal = unifyDeal(deals.data);
            return { result: deal };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async getUnifiedDeals(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        let fields = req.query.fields;
        const pageSize = parseInt(String(req.query.pageSize));
        const cursor = req.query.cursor;
        console.log('Revert::GET ALL DEAL', tenantId, thirdPartyId, thirdPartyToken);
        if (thirdPartyId === 'hubspot') {
            fields = [
                ...String(req.query.fields || '').split(','),
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
                url: `https://api.hubapi.com/crm/v3/objects/deals?properties=${fields}&${pagingString}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            const nextCursor = deals.data?.paging?.next?.after || null;
            deals = deals.data.results as any[];
            deals = deals?.map((l: any) => unifyDeal({ ...l, ...l?.properties }));
            return {
                next: nextCursor,
                previous: null, // Field not supported by Hubspot.
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
            const nextCursor = deals.data?.info?.next_page_token || null;
            const prevCursor = deals.data?.info?.previous_page_token || null;
            deals = deals.data.data;
            deals = deals?.map((l: any) => unifyDeal(l));
            return { next: nextCursor, previous: prevCursor, results: deals };
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
            const nextCursor = pageSize ? String(deals.data?.totalSize + (parseInt(String(cursor)) || 0)) : null;
            const prevCursor =
                cursor && parseInt(String(cursor)) > 0
                    ? String(parseInt(String(cursor)) - deals.data?.totalSize)
                    : null;
            deals = deals.data?.records;
            deals = deals?.map((l: any) => unifyDeal(l));
            return { next: nextCursor, previous: prevCursor, results: deals };
        } else {
            return { error: 'Unrecognized CRM' };
        }
    }
    async searchUnifiedDeals(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const searchCriteria = req.body.searchCriteria;
        const fields = String(req.query.fields || '')
            .split(',')
            .filter(Boolean);
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
                            ...fields,
                        ],
                    }),
                });
                deals = deals.data.results as any[];
                deals = deals?.map((l: any) => unifyDeal({ ...l, ...l?.properties }));
                return {
                    status: 'ok',
                    results: deals,
                };
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
                deals = deals?.map((l: any) => unifyDeal(l));
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
                deals = deals?.map((l: any) => unifyDeal(l));
                return { status: 'ok', results: deals };
            }
            case TP_ID.pipedrive: {
                const instanceUrl = connection.tp_account_url;
                const result = await axios.get<
                    { data: { items: { item: any; result_score: number }[] } } & PipedrivePagination
                >(
                    `${instanceUrl}/v1/deals/search?term=${searchCriteria}${
                        fields.length ? `&fields=${fields.join(',')}` : ''
                    }`,
                    {
                        headers: {
                            Authorization: `Bearer ${thirdPartyToken}`,
                        },
                    }
                );
                const deals = result.data.data.items.map((item) => item.item);
                const unifiedDeals = deals?.map((d: any) => unifyDeal(d));
                return { status: 'ok', results: unifiedDeals };
            }
            default: {
                return {
                    error: 'Unrecognised CRM',
                };
            }
        }
    }
    async createDeal(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const deal = disunifyDeal(req.body, thirdPartyId);
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
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async updateDeal(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const deal = disunifyDeal(req.body, thirdPartyId);
        const dealId = req.params.id;
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
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
}

export default new DealService();
