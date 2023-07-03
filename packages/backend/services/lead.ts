import axios from 'axios';
import { disunifyLead, unifyLead } from '../models/unified/lead';
import { filterLeadsFromContactsForHubspot } from '../helpers/filterLeadsFromContacts';
import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { TP_ID } from '@prisma/client';

class LeadService {
    async getUnifiedLead(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const leadId = req.params.id;
        let fields = req.query.fields;
        console.log('Revert::GET LEAD', tenantId, thirdPartyId, thirdPartyToken, leadId);
        if (thirdPartyId === 'hubspot') {
            fields = [
                ...String(req.query.fields || '').split(','),
                'hs_lead_status',
                'firstname',
                'email',
                'lastname',
                'hs_object_id',
                'phone',
            ];
            let lead: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/contacts/${leadId}?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            lead = filterLeadsFromContactsForHubspot([lead.data] as any[])?.[0];
            return {
                result: unifyLead({ ...lead, ...lead?.properties }),
            };
        } else if (thirdPartyId === 'zohocrm') {
            const leads = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Leads/${leadId}?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            let lead = leads.data.data?.[0];
            return { result: unifyLead(lead) };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            const leads = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/sobjects/Lead/${leadId}`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            let lead = leads.data;
            return { result: unifyLead(lead) };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async getUnifiedLeads(
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
        console.log('Revert::GET ALL LEADS', tenantId, thirdPartyId, thirdPartyToken);
        if (thirdPartyId === TP_ID.hubspot) {
            fields = [
                ...String(req.query.fields || '').split(','),
                'hs_lead_status',
                'firstname',
                'email',
                'lastname',
                'hs_object_id',
                'phone',
            ];
            const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${cursor ? `&after=${cursor}` : ''}`;
            let leads: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/contacts?properties=${fields}&${pagingString}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            const nextCursor = leads.data?.paging?.next?.after || null;
            leads = filterLeadsFromContactsForHubspot(leads.data.results as any[]);
            leads = leads?.map((l: any) => unifyLead({ ...l, ...l?.properties }));
            return {
                next: nextCursor,
                previous: null, // Field not supported by Hubspot.
                results: leads,
            };
        } else if (thirdPartyId === TP_ID.zohocrm) {
            const pagingString = `${pageSize ? `&per_page=${pageSize}` : ''}${cursor ? `&page_token=${cursor}` : ''}`;
            let leads: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Leads?fields=${fields}${pagingString}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            const nextCursor = leads.data?.info?.next_page_token || null;
            const prevCursor = leads.data?.info?.previous_page_token || null;
            leads = leads.data.data;
            leads = leads?.map((l: any) => unifyLead(l));
            return { next: nextCursor, previous: prevCursor, results: leads };
        } else if (thirdPartyId === TP_ID.sfdc) {
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
                    ? `SELECT+fields(all)+from+Lead+${pagingString}`
                    : `SELECT+${(fields as string).split(',').join('+,+')}+from+Lead+${pagingString}`;
            let leads: any = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/query/?q=${query}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            const nextCursor = pageSize ? String(leads.data?.totalSize + (parseInt(String(cursor)) || 0)) : null;
            const prevCursor =
                cursor && parseInt(String(cursor)) > 0
                    ? String(parseInt(String(cursor)) - leads.data?.totalSize)
                    : null;
            leads = leads.data?.records;
            leads = leads?.map((l: any) => unifyLead(l));
            return { next: nextCursor, previous: prevCursor, results: leads };
        } else if (thirdPartyId === TP_ID.pipedrive) {
            const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${cursor ? `&start=${cursor}` : ''}`;
            let leads: any = await axios({
                method: 'get',
                url: `${connection.tp_account_url}/v1/leads?${pagingString}`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            const nextCursor = leads.data?.additional_data?.next_start || null;
            const prevCursor = null;
            leads = leads.data.data;
            const populatedLeads = await Promise.all(leads.map(async (lead: any) => {
                const personId = lead.person_id;
                const person = await axios({
                    method: 'get',
                    url: `${connection.tp_account_url}/v1/persons/${personId}`,
                    headers: {
                        Authorization: `Bearer ${thirdPartyToken}`,
                    },
                });
                return {
                    ...lead,
                    person: person.data.data
                }
            }))
            console.log("blah raw leads", leads);
            console.log("blah populated leads", populatedLeads);
            leads = populatedLeads?.map((l: any) => unifyLead(l));
            return { next: nextCursor, previous: prevCursor, results: leads };
        } else {
            return { error: 'Unrecognized CRM' };
        }
    }
    async searchUnifiedLeads(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const searchCriteria = req.body.searchCriteria;
        const fields = String(req.query.fields || '').split(',');
        console.log('Revert::SEARCH LEAD', tenantId, searchCriteria, fields);
        if (thirdPartyId === 'hubspot') {
            let leads: any = await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/contacts/search`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify({
                    ...searchCriteria,
                    properties: [
                        'hs_lead_status',
                        'firstname',
                        'email',
                        'lastname',
                        'hs_object_id',
                        'phone',
                        ...fields,
                    ],
                }),
            });
            leads = filterLeadsFromContactsForHubspot(leads.data.results as any[]);
            leads = leads?.map((l: any) => unifyLead({ ...l, ...l?.properties }));
            return {
                status: 'ok',
                results: leads,
            };
        } else if (thirdPartyId === 'zohocrm') {
            let leads: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Leads/search?criteria=${searchCriteria}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            leads = leads.data.data;
            leads = leads?.map((l: any) => unifyLead(l));
            return { status: 'ok', results: leads };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            let leads: any = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/search?q=${searchCriteria}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            leads = leads?.data?.searchRecords;
            leads = leads?.map((l: any) => unifyLead(l));
            return { status: 'ok', results: leads };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async createLead(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const lead = disunifyLead(req.body, thirdPartyId);
        console.log('Revert::CREATE LEAD', tenantId, lead);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/contacts/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            return {
                status: 'ok',
                message: 'Hubspot lead created',
                result: lead,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'post',
                url: `https://www.zohoapis.com/crm/v3/Leads`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            return { status: 'ok', message: 'Zoho lead created', result: lead };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            const leadCreated = await axios({
                method: 'post',
                url: `${instanceUrl}/services/data/v56.0/sobjects/Lead/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            return {
                status: 'ok',
                message: 'SFDC lead created',
                result: leadCreated.data,
            };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async updateLead(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const lead = disunifyLead(req.body, thirdPartyId);
        const leadId = req.params.id;
        console.log('Revert::UPDATE LEAD', tenantId, lead, leadId);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'patch',
                url: `https://api.hubapi.com/crm/v3/objects/contacts/${leadId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            return {
                status: 'ok',
                message: 'Hubspot lead updated',
                result: lead,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'put',
                url: `https://www.zohoapis.com/crm/v3/Leads/${leadId}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            return { status: 'ok', message: 'Zoho lead updated', result: lead };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            await axios({
                method: 'patch',
                url: `${instanceUrl}/services/data/v56.0/sobjects/Lead/${leadId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            return { status: 'ok', message: 'SFDC lead updated', result: lead };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
}

export default new LeadService();
