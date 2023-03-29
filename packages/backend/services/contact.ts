import axios from 'axios';
import { unifyContact } from '../models/unified/unifiedContact';
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
            let contact: any = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Contact/${contactId}`,
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
            // NOTE: Handle "ALL" for Hubspot & Zoho
            const query =
                fields === 'ALL'
                    ? 'SELECT+fields(all)+from+Contact+limit+200'
                    : `SELECT+${(fields as string).split(',').join('+,+')}+from+Contact`;
            let contacts: any = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/query/?q=${query}`,
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
                    properties: ['hs_lead_status', 'firstname', 'email', 'lastname', 'hs_object_id'],
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
            let contacts: any = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/search?q=${searchCriteria}`,
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
}

export default new ContactService();
