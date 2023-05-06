import axios from 'axios';
import { disunifyContact, unifyContact } from '../models/unified/contact';
import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

class ContactService {
    async getUnifiedContact(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const contactId = req.params.id;
        const fields = req.query.fields;
        console.log('Revert::GET CONTACT', tenantId, thirdPartyId, thirdPartyToken, contactId);
        if (thirdPartyId === 'hubspot') {
            let contact: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            contact = unifyContact({ ...contact.data, ...contact.data?.properties });
            return {
                result: contact,
            };
        } else if (thirdPartyId === 'zohocrm') {
            let contact: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Contacts/${contactId}?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            contact = unifyContact(contact.data.data?.[0]);
            return { result: contact };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            let contact: any = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/sobjects/Contact/${contactId}`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            contact = contact.data;
            contact = unifyContact(contact);
            return { result: contact };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async getUnifiedContacts(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const fields = req.query.fields;
        console.log('Revert::GET ALL CONTACTS', tenantId, thirdPartyId, thirdPartyToken);
        if (thirdPartyId === 'hubspot') {
            let contacts: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/contacts?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            contacts = contacts.data.results as any[];
            contacts = contacts?.map((l: any) => unifyContact({ ...l, ...l?.properties }));
            return {
                results: contacts,
            };
        } else if (thirdPartyId === 'zohocrm') {
            let contacts: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Contacts?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            contacts = contacts.data.data;
            contacts = contacts?.map((l: any) => unifyContact(l));
            return { results: contacts };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            // NOTE: Handle "ALL" for Hubspot & Zoho
            const query =
                fields === 'ALL'
                    ? 'SELECT+fields(all)+from+Contact+limit+200'
                    : `SELECT+${(fields as string).split(',').join('+,+')}+from+Contact`;
            let contacts: any = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/query/?q=${query}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            contacts = contacts.data?.records;
            contacts = contacts?.map((l: any) => unifyContact(l));
            return { results: contacts };
        } else {
            return { error: 'Unrecognized CRM' };
        }
    }
    async searchUnifiedContacts(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const searchCriteria = req.body.searchCriteria;
        const fields = String(req.query.fields || '').split(',');
        console.log('Revert::SEARCH CONTACT', tenantId, searchCriteria);
        if (thirdPartyId === 'hubspot') {
            let contacts: any = await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/contacts/search`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify({
                    ...searchCriteria,
                    properties: ['hs_lead_status', 'firstname', 'email', 'lastname', 'hs_object_id', ...fields],
                }),
            });
            contacts = contacts.data.results as any[];
            contacts = contacts?.map((l: any) => unifyContact({ ...l, ...l?.properties }));
            return {
                status: 'ok',
                results: contacts,
            };
        } else if (thirdPartyId === 'zohocrm') {
            let contacts: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Contacts/search?criteria=${searchCriteria}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            contacts = contacts.data.data;
            contacts = contacts?.map((l: any) => unifyContact(l));
            return { status: 'ok', results: contacts };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            let contacts: any = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/search?q=${searchCriteria}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });

            contacts = contacts.data?.searchRecords;
            contacts = contacts?.map((l: any) => unifyContact(l));

            return { status: 'ok', results: contacts };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async createContact(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const contact = disunifyContact(req.body, thirdPartyId);
        console.log('Revert::CREATE CONTACT', tenantId, contact);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/contacts/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(contact),
            });
            return {
                status: 'ok',
                message: 'Hubspot contact created',
                result: contact,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'post',
                url: `https://www.zohoapis.com/crm/v3/Contacts`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(contact),
            });
            return { status: 'ok', message: 'Zoho contact created', result: contact };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            const contactCreated = await axios({
                method: 'post',
                url: `${instanceUrl}/services/data/v56.0/sobjects/Contact/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(contact),
            });
            return {
                status: 'ok',
                message: 'SFDC contact created',
                result: contactCreated.data,
            };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async updateContact(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const contact = disunifyContact(req.body, thirdPartyId);
        const contactId = req.params.id;
        console.log('Revert::UPDATE CONTACT', tenantId, contact, contactId);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'patch',
                url: `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(contact),
            });
            return {
                status: 'ok',
                message: 'Hubspot contact created',
                result: contact,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'put',
                url: `https://www.zohoapis.com/crm/v3/Contacts/${contactId}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(contact),
            });
            return { status: 'ok', message: 'Zoho contact updated', result: contact };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            await axios({
                method: 'patch',
                url: `${instanceUrl}/services/data/v56.0/sobjects/Contact/${contactId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(contact),
            });
            return { status: 'ok', message: 'SFDC contact updated', result: contact };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
}

export default new ContactService();
