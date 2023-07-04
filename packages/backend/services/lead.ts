import axios from 'axios';
import { PipedriveLead, PipedriveOrganization, PipedrivePerson, disunifyLead, unifyLead } from '../models/unified/lead';
import { filterLeadsFromContactsForHubspot } from '../helpers/filterLeadsFromContacts';
import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { TP_ID } from '@prisma/client';
import { PipedrivePagination } from '../constants/pipedrive';

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

        switch (thirdPartyId) {
            case TP_ID.hubspot: {
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
            }
            case TP_ID.zohocrm: {
                const leads = await axios({
                    method: 'get',
                    url: `https://www.zohoapis.com/crm/v3/Leads/${leadId}?fields=${fields}`,
                    headers: {
                        authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                    },
                });
                let lead = leads.data.data?.[0];
                return { result: unifyLead(lead) };
            }
            case TP_ID.sfdc: {
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
            }
            case TP_ID.pipedrive: {
                const result = await axios.get<{ data: Partial<PipedriveLead> } & PipedrivePagination>(
                    `${connection.tp_account_url}/v1/leads/${leadId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${thirdPartyToken}`,
                        },
                    }
                );
                const lead = result.data;
                const populatedLead = await this.populatePersonOrOrganizationForPipedriveLead({
                    lead: lead.data,
                    account_url: connection.tp_account_url,
                    thirdPartyToken,
                });
                return { result: unifyLead(populatedLead) };
            }
            default: {
                return {
                    error: 'Unrecognised CRM',
                };
            }
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

        switch (thirdPartyId) {
            case TP_ID.hubspot: {
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
            }
            case TP_ID.zohocrm: {
                const pagingString = `${pageSize ? `&per_page=${pageSize}` : ''}${
                    cursor ? `&page_token=${cursor}` : ''
                }`;
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
            }
            case TP_ID.sfdc: {
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
            }
            case TP_ID.pipedrive: {
                const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${cursor ? `&start=${cursor}` : ''}`;
                const result = await axios.get<{ data: Partial<PipedriveLead>[] } & PipedrivePagination>(
                    `${connection.tp_account_url}/v1/leads?${pagingString}`,
                    {
                        headers: {
                            Authorization: `Bearer ${thirdPartyToken}`,
                        },
                    }
                );
                const nextCursor = result.data?.additional_data?.pagination.next_start || null;
                const prevCursor = null;
                const leads = result.data.data;
                const populatedLeads = await Promise.all(
                    leads.map(async (lead) => {
                        return await this.populatePersonOrOrganizationForPipedriveLead({
                            lead,
                            account_url: connection.tp_account_url,
                            thirdPartyToken,
                        });
                    })
                );
                const unifiedLeads = populatedLeads?.map((l) => unifyLead(l));
                return { next: nextCursor, previous: prevCursor, results: unifiedLeads };
            }
            default: {
                return { error: 'Unrecognized CRM' };
            }
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
        const fields = String(req.query.fields || '')
            .split(',')
            .filter(Boolean);
        console.log('Revert::SEARCH LEAD', tenantId, searchCriteria, fields);

        switch (thirdPartyId) {
            case TP_ID.hubspot: {
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
            }
            case TP_ID.zohocrm: {
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
            }
            case TP_ID.sfdc: {
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
            }
            case TP_ID.pipedrive: {
                const instanceUrl = connection.tp_account_url;
                const result = await axios.get<
                    { data: { items: { item: Partial<PipedriveLead> }[]; result_score: number } } & PipedrivePagination
                >(
                    `${instanceUrl}/v1/leads/search?term=${searchCriteria}${
                        fields.length ? `&fields=${fields.join(',')}` : ''
                    }`,
                    {
                        headers: {
                            Authorization: `Bearer ${thirdPartyToken}`,
                        },
                    }
                );
                // this api has person and organization auto populated
                const leads = result.data.data.items.map((item) => item.item);
                const unifiedLeads = leads?.map((l: any) => unifyLead(l));
                return { status: 'ok', results: unifiedLeads };
            }
            default: {
                return {
                    error: 'Unrecognised CRM',
                };
            }
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

        switch (thirdPartyId) {
            case TP_ID.hubspot: {
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
            }
            case TP_ID.zohocrm: {
                await axios({
                    method: 'post',
                    url: `https://www.zohoapis.com/crm/v3/Leads`,
                    headers: {
                        authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                    },
                    data: JSON.stringify(lead),
                });
                return { status: 'ok', message: 'Zoho lead created', result: lead };
            }
            case TP_ID.sfdc: {
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
            }
            case TP_ID.pipedrive: {
                const instanceUrl = connection.tp_account_url;
                const pipedriveLead = lead as Partial<PipedriveLead>;
                const isPerson = req.body.leadType === 'PERSON';
                const url = isPerson ? `${instanceUrl}/v1/persons` : `${instanceUrl}/v1/organizations`;
                const entityCreated = await axios.post(
                    url,
                    isPerson ? pipedriveLead.person : pipedriveLead.organization,
                    {
                        headers: {
                            Authorization: `Bearer ${thirdPartyToken}`,
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                        },
                    }
                );
                const leadCreated = await axios.post(`${instanceUrl}/v1/leads`, pipedriveLead, {
                    headers: {
                        Authorization: `Bearer ${thirdPartyToken}`,
                    },
                });
                return {
                    status: 'ok',
                    message: 'Pipedrive lead created',
                    result: {
                        ...leadCreated.data,
                        ...(isPerson ? { person: entityCreated.data.data } : { organization: entityCreated.data.data }),
                    },
                };
            }
            default: {
                return {
                    error: 'Unrecognised CRM',
                };
            }
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

        switch (thirdPartyId) {
            case TP_ID.hubspot: {
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
            }
            case TP_ID.zohocrm: {
                await axios({
                    method: 'put',
                    url: `https://www.zohoapis.com/crm/v3/Leads/${leadId}`,
                    headers: {
                        authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                    },
                    data: JSON.stringify(lead),
                });
                return { status: 'ok', message: 'Zoho lead updated', result: lead };
            }
            case TP_ID.sfdc: {
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
            }
            case TP_ID.pipedrive: {
                const leadUpdated = await axios.patch(`${connection.tp_account_url}/v1/leads/${leadId}`, lead, {
                    headers: {
                        Authorization: `Bearer ${thirdPartyToken}`,
                    },
                });
                return {
                    status: 'ok',
                    message: 'Pipedrive lead updated',
                    result: {
                        ...leadUpdated.data,
                    },
                };
            }
            default: {
                return {
                    error: 'Unrecognised CRM',
                };
            }
        }
    }

    async populatePersonOrOrganizationForPipedriveLead({
        lead,
        account_url,
        thirdPartyToken,
    }: {
        lead: Partial<PipedriveLead>;
        account_url: string;
        thirdPartyToken: string;
    }) {
        const isPerson = !!lead.person_id;
        const url = isPerson
            ? `${account_url}/v1/persons/${lead.person_id}`
            : `${account_url}/v1/organizations/${lead.organization_id}`;
        const result = await axios.get<
            { data: Partial<PipedrivePerson | PipedriveOrganization> } & PipedrivePagination
        >(url, {
            headers: {
                Authorization: `Bearer ${thirdPartyToken}`,
            },
        });
        return {
            ...lead,
            ...(isPerson ? { person: result.data.data } : { organization: result.data.data }),
        };
    }
}

export default new LeadService();
