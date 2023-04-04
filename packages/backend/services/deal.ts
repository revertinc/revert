import axios from 'axios';
import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

class DealService {
    async getUnifiedDeal(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const noteId = req.params.id;
        const fields = req.query.fields;
        console.log('Revert::GET DEAL', tenantId, thirdPartyId, thirdPartyToken, noteId);
        if (thirdPartyId === 'hubspot') {
            let note: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/deals/${noteId}?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            note = ([note.data] as any[])?.[0];
            return {
                result: { ...note, ...note?.properties },
            };
        } else if (thirdPartyId === 'zohocrm') {
            const deals = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/deals/${noteId}?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            let note = deals.data.data?.[0];
            return { result: note };
        } else if (thirdPartyId === 'sfdc') {
            const deals = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Opportunity/${noteId}`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            let note = deals.data;
            return { result: note };
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
        const fields = req.query.fields;
        console.log('Revert::GET ALL DEAL', tenantId, thirdPartyId, thirdPartyToken);
        if (thirdPartyId === 'hubspot') {
            let deals: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/deals?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            deals = deals.data.results as any[];
            deals = deals?.map((l: any) => ({ ...l, ...l?.properties }));
            return {
                results: deals,
            };
        } else if (thirdPartyId === 'zohocrm') {
            let deals: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/deals?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            deals = deals.data.data;
            deals = deals?.map((l: any) => l);
            return { results: deals };
        } else if (thirdPartyId === 'sfdc') {
            // TODO: Handle "ALL" for Hubspot & Zoho
            const query =
                fields === 'ALL'
                    ? 'SELECT+fields(all)+from+Opportunity+limit+200'
                    : `SELECT+${(fields as string).split(',').join('+,+')}+from+Opportunity`;
            let deals: any = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/query/?q=${query}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            deals = deals.data?.records;
            deals = deals?.map((l: any) => l);
            return { results: deals };
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
        const fields = String(req.query.fields || '').split(',');
        console.log('Revert::SEARCH DEAL', tenantId, searchCriteria, fields);
        if (thirdPartyId === 'hubspot') {
            let deals: any = await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/deals/search`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify({
                    ...searchCriteria,
                    properties: ['hs_note_status', 'firstname', 'email', 'lastname', 'hs_object_id', ...fields],
                }),
            });
            deals = deals.data.results as any[];
            deals = deals?.map((l: any) => ({ ...l, ...l?.properties }));
            return {
                status: 'ok',
                results: deals,
            };
        } else if (thirdPartyId === 'zohocrm') {
            let deals: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/deals/search?criteria=${searchCriteria}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            deals = deals.data.data;
            deals = deals?.map((l: any) => l);
            return { status: 'ok', results: deals };
        } else if (thirdPartyId === 'sfdc') {
            let deals: any = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/search?q=${searchCriteria}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            deals = deals?.data?.searchRecords;
            deals = deals?.map((l: any) => l);
            return { status: 'ok', results: deals };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
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
        const note = (req.body, thirdPartyId);
        console.log('Revert::CREATE DEAL', tenantId, note);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/deals/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(note),
            });
            return {
                status: 'ok',
                message: 'Hubspot note created',
                result: note,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'post',
                url: `https://www.zohoapis.com/crm/v3/deals`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(note),
            });
            return { status: 'ok', message: 'Zoho note created', result: note };
        } else if (thirdPartyId === 'sfdc') {
            const noteCreated = await axios({
                method: 'post',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Opportunity/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(note),
            });
            return {
                status: 'ok',
                message: 'SFDC note created',
                result: noteCreated.data,
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
        const note = (req.body, thirdPartyId);
        const noteId = req.params.id;
        console.log('Revert::UPDATE DEAL', tenantId, note, noteId);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'patch',
                url: `https://api.hubapi.com/crm/v3/objects/deals/${noteId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(note),
            });
            return {
                status: 'ok',
                message: 'Hubspot note created',
                result: note,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'put',
                url: `https://www.zohoapis.com/crm/v3/deals/${noteId}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(note),
            });
            return { status: 'ok', message: 'Zoho note updated', result: note };
        } else if (thirdPartyId === 'sfdc') {
            await axios({
                method: 'patch',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Opportunity/${noteId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(note),
            });
            return { status: 'ok', message: 'SFDC note updated', result: note };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
}

export default new DealService();
