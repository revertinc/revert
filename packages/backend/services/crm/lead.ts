import axios from 'axios';
import { TP_ID } from '@prisma/client';

import { LeadService } from '../../generated/typescript/api/resources/crm/resources/lead/service/LeadService';
import { InternalServerError } from '../../generated/typescript/api/resources/common';
import { NotFoundError } from '../../generated/typescript/api/resources/common';
import logError from '../../helpers/logError';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import revertAuthMiddleware from '../../helpers/authMiddleware';
import { filterLeadsFromContactsForHubspot } from '../../helpers/filterLeadsFromContacts';
import { UnifiedLead, disunifyLead, unifyLead } from '../../models/unified/lead';
import {
    PipedrivePagination,
    PipedriveLead,
    PipedriveContact,
    PipedriveOrganization,
} from '../../constants/pipedrive';

const leadService = new LeadService(
    {
        async getUnifiedLead(req, res) {
            try {
                const connection = res.locals.connection;
                const leadId = req.params.id;
                const fields = req.query.fields;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::GET LEAD', tenantId, thirdPartyId, thirdPartyToken, leadId);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        const formattedFields = [
                            ...String(fields || '').split(','),
                            'hs_lead_status',
                            'firstname',
                            'email',
                            'lastname',
                            'hs_object_id',
                            'phone',
                        ];
                        let lead: any = await axios({
                            method: 'get',
                            url: `https://api.hubapi.com/crm/v3/objects/contacts/${leadId}?properties=${formattedFields}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        lead = filterLeadsFromContactsForHubspot([lead.data] as any[])?.[0];
                        res.send({ status: 'ok', result: unifyLead({ ...lead, ...lead?.properties }, thirdPartyId) });
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
                        res.send({ status: 'ok', result: unifyLead(lead, thirdPartyId) });
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
                        res.send({ status: 'ok', result: unifyLead(lead, thirdPartyId) });
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
                        const populatedLead = await populatePersonOrOrganizationForPipedriveLead({
                            lead: lead.data,
                            account_url: connection.tp_account_url as string,
                            thirdPartyToken,
                        });
                        res.send({ status: 'ok', result: unifyLead(populatedLead, thirdPartyId) });
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognised CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch lead', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getUnifiedLeads(req, res) {
            try {
                const connection = res.locals.connection;
                const fields = req.query.fields;
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::GET ALL LEADS', tenantId, thirdPartyId, thirdPartyToken);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        const formattedFields = [
                            ...String(fields || '').split(','),
                            'hs_lead_status',
                            'firstname',
                            'email',
                            'lastname',
                            'hs_object_id',
                            'phone',
                        ];
                        const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&after=${cursor}` : ''
                        }`;
                        let leads: any = await axios({
                            method: 'get',
                            url: `https://api.hubapi.com/crm/v3/objects/contacts?properties=${formattedFields}&${pagingString}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        const nextCursor = leads.data?.paging?.next?.after || null;
                        leads = filterLeadsFromContactsForHubspot(leads.data.results as any[]);
                        leads = leads?.map((l: any) => unifyLead({ ...l, ...l?.properties }, thirdPartyId));
                        res.send({
                            status: 'ok',
                            next: nextCursor,
                            previous: undefined, // Field not supported by Hubspot.
                            results: leads,
                        });
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
                        leads = leads?.map((l: any) => unifyLead(l, thirdPartyId));
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: leads });
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
                        const nextCursor = pageSize
                            ? String(leads.data?.totalSize + (parseInt(String(cursor)) || 0))
                            : undefined;
                        const prevCursor =
                            cursor && parseInt(String(cursor)) > 0
                                ? String(parseInt(String(cursor)) - leads.data?.totalSize)
                                : undefined;
                        leads = leads.data?.records;
                        leads = leads?.map((l: any) => unifyLead(l, thirdPartyId));
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: leads });
                    }
                    case TP_ID.pipedrive: {
                        const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&start=${cursor}` : ''
                        }`;
                        const result = await axios.get<{ data: Partial<PipedriveLead>[] } & PipedrivePagination>(
                            `${connection.tp_account_url}/v1/leads?${pagingString}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        const nextCursor = String(result.data?.additional_data?.pagination.next_start) || undefined;
                        const prevCursor = undefined;
                        const leads = result.data.data;
                        const populatedLeads = await Promise.all(
                            leads.map(async (lead) => {
                                return await populatePersonOrOrganizationForPipedriveLead({
                                    lead,
                                    account_url: connection.tp_account_url as string,
                                    thirdPartyToken,
                                });
                            })
                        );
                        const unifiedLeads = populatedLeads?.map((l) => unifyLead(l, thirdPartyId));
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: unifiedLeads });
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognised CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch leads', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createLead(req, res) {
            try {
                const leadData = req.body as UnifiedLead;
                const connection = res.locals.connection;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const lead = disunifyLead(leadData, thirdPartyId);
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
                        res.send({
                            status: 'ok',
                            message: 'Hubspot lead created',
                            result: lead,
                        });
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
                        res.send({ status: 'ok', message: 'Zoho lead created', result: lead });
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
                        res.send({
                            status: 'ok',
                            message: 'SFDC lead created',
                            result: leadCreated.data,
                        });
                    }
                    case TP_ID.pipedrive: {
                        const instanceUrl = connection.tp_account_url;
                        const pipedriveLead = lead as Partial<PipedriveLead>;
                        const leadCreated = await axios.post<{ data: Partial<PipedriveLead> }>(
                            `${instanceUrl}/v1/leads`,
                            pipedriveLead,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        res.send({
                            status: 'ok',
                            message: 'Pipedrive lead created',
                            result: {
                                ...leadCreated.data.data,
                            },
                        });
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognised CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not create lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateLead(req, res) {
            try {
                const connection = res.locals.connection;
                const leadData = req.body as UnifiedLead;
                const leadId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const lead = disunifyLead(leadData, thirdPartyId);
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
                        res.send({
                            status: 'ok',
                            message: 'Hubspot lead updated',
                            result: lead,
                        });
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
                        res.send({ status: 'ok', message: 'Zoho lead updated', result: lead });
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
                        res.send({ status: 'ok', message: 'SFDC lead updated', result: lead });
                    }
                    case TP_ID.pipedrive: {
                        const leadUpdated = await axios.patch<{ data: Partial<PipedriveLead> }>(
                            `${connection.tp_account_url}/v1/leads/${leadId}`,
                            lead,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        res.send({
                            status: 'ok',
                            message: 'Pipedrive lead updated',
                            result: {
                                ...leadUpdated.data.data,
                            },
                        });
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognised CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not update lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async searchLeads(req, res) {
            try {
                const connection = res.locals.connection;
                const fields = req.query.fields;
                const searchCriteria: any = req.body.searchCriteria;
                const formattedFields = (fields || '').split('').filter(Boolean);
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
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
                                    ...formattedFields,
                                ],
                            }),
                        });
                        leads = filterLeadsFromContactsForHubspot(leads.data.results as any[]);
                        leads = leads?.map((l: any) => unifyLead({ ...l, ...l?.properties }, thirdPartyId));
                        res.send({
                            status: 'ok',
                            results: leads,
                        });
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
                        leads = leads?.map((l: any) => unifyLead(l, thirdPartyId));
                        res.send({ status: 'ok', results: leads });
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
                        leads = leads?.map((l: any) => unifyLead(l, thirdPartyId));
                        res.send({ status: 'ok', results: leads });
                    }
                    case TP_ID.pipedrive: {
                        const instanceUrl = connection.tp_account_url;
                        const result = await axios.get<
                            {
                                data: { items: { item: Partial<PipedriveLead> }[]; result_score: number };
                            } & PipedrivePagination
                        >(
                            `${instanceUrl}/v1/leads/search?term=${searchCriteria}${
                                formattedFields.length ? `&fields=${formattedFields.join(',')}` : ''
                            }`,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        // this api has person and organization auto populated
                        const leads = result.data.data.items.map((item) => item.item);
                        const unifiedLeads = leads?.map((l: any) => unifyLead(l, thirdPartyId));
                        res.send({ status: 'ok', results: unifiedLeads });
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognised CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not search CRM', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { leadService };

const populatePersonOrOrganizationForPipedriveLead = async ({
    lead,
    account_url,
    thirdPartyToken,
}: {
    lead: Partial<PipedriveLead>;
    account_url: string;
    thirdPartyToken: string;
}) => {
    const isPerson = !!lead.person_id;
    const url = isPerson
        ? `${account_url}/v1/persons/${lead.person_id}`
        : `${account_url}/v1/organizations/${lead.organization_id}`;
    const result = await axios.get<{ data: Partial<PipedriveContact | PipedriveOrganization> } & PipedrivePagination>(
        url,
        {
            headers: {
                Authorization: `Bearer ${thirdPartyToken}`,
            },
        }
    );
    return {
        ...lead,
        ...(isPerson ? { person: result.data.data } : { organization: result.data.data }),
    };
};
