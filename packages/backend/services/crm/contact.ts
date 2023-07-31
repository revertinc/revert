import axios from 'axios';
import { TP_ID } from '@prisma/client';

import { ContactService } from '../../generated/typescript/api/resources/crm/resources/contact/service/ContactService';
import { InternalServerError } from '../../generated/typescript/api/resources/common';
import { PipedrivePagination } from '../../constants/pipedrive';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import logError from '../../helpers/logError';
import revertAuthMiddleware from '../../helpers/authMiddleware';
import { UnifiedContact, disunifyContact, unifyContact } from '../../models/unified/contact';
import { NotFoundError } from '../../generated/typescript/api/resources/common';

const contactService = new ContactService(
    {
        async getContact(req, res) {
            try {
                const connection = res.locals.connection;
                const contactId = req.params.id;
                const fields = req.query.fields;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::GET CONTACT', tenantId, thirdPartyId, thirdPartyToken, contactId);
                if (thirdPartyId === 'hubspot') {
                    const formattedFields = [
                        ...String(fields || '').split(','),
                        'hs_lead_status',
                        'firstname',
                        'email',
                        'lastname',
                        'hs_object_id',
                        'phone',
                    ];
                    let contact: any = await axios({
                        method: 'get',
                        url: `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=${formattedFields}`,
                        headers: {
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                    });
                    contact = unifyContact({ ...contact.data, ...contact.data?.properties });
                    res.send({ status: 'ok', result: contact });
                } else if (thirdPartyId === 'zohocrm') {
                    let contact: any = await axios({
                        method: 'get',
                        url: `https://www.zohoapis.com/crm/v3/Contacts/${contactId}?fields=${fields}`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                    });
                    contact = unifyContact(contact.data.data?.[0]);
                    res.send({ status: 'ok', result: contact });
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
                    res.send({ status: 'ok', result: contact });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch lead', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getContacts(req, res) {
            try {
                const connection = res.locals.connection;
                const fields = req.query.fields;
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::GET ALL CONTACTS', tenantId, thirdPartyId, thirdPartyToken);
                if (thirdPartyId === 'hubspot') {
                    const formattedFields = [
                        ...String(fields || '').split(','),
                        'hs_lead_status',
                        'firstname',
                        'email',
                        'lastname',
                        'hs_object_id',
                        'phone',
                    ];
                    const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${cursor ? `&after=${cursor}` : ''}`;
                    let contacts: any = await axios({
                        method: 'get',
                        url: `https://api.hubapi.com/crm/v3/objects/contacts?properties=${formattedFields}&${pagingString}`,
                        headers: {
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                    });
                    const nextCursor = contacts.data?.paging?.next?.after || undefined;
                    contacts = contacts.data.results as any[];
                    contacts = contacts?.map((l: any) => unifyContact({ ...l, ...l?.properties }));
                    res.send({
                        status: 'ok',
                        next: nextCursor,
                        previous: undefined, // Field not supported by Hubspot.
                        results: contacts,
                    });
                } else if (thirdPartyId === 'zohocrm') {
                    const pagingString = `${pageSize ? `&per_page=${pageSize}` : ''}${
                        cursor ? `&page_token=${cursor}` : ''
                    }`;
                    let contacts: any = await axios({
                        method: 'get',
                        url: `https://www.zohoapis.com/crm/v3/Contacts?fields=${fields}${pagingString}`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                    });
                    const nextCursor = contacts.data?.info?.next_page_token || undefined;
                    const prevCursor = contacts.data?.info?.previous_page_token || undefined;
                    contacts = contacts.data.data;
                    contacts = contacts?.map((l: any) => unifyContact(l));
                    res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: contacts });
                } else if (thirdPartyId === 'sfdc') {
                    let pagingString = `${pageSize ? `ORDER+BY+Id+DESC+LIMIT+${pageSize}+` : ''}${
                        cursor ? `OFFSET+${cursor}` : ''
                    }`;
                    if (!pageSize && !cursor) {
                        pagingString = 'LIMIT 200';
                    }
                    const instanceUrl = connection.tp_account_url;
                    // NOTE: Handle "ALL" for Hubspot & Zoho
                    const query =
                        !fields || fields === 'ALL'
                            ? `SELECT+fields(all)+from+Contact+${pagingString}`
                            : `SELECT+${(fields as string).split(',').join('+,+')}+from+Contact+${pagingString}`;
                    let contacts: any = await axios({
                        method: 'get',
                        url: `${instanceUrl}/services/data/v56.0/query/?q=${query}`,
                        headers: {
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                    });
                    const nextCursor = pageSize
                        ? String(contacts.data?.totalSize + (parseInt(String(cursor)) || 0))
                        : undefined;
                    const prevCursor =
                        cursor && parseInt(String(cursor)) > 0
                            ? String(parseInt(String(cursor)) - contacts.data?.totalSize)
                            : undefined;
                    contacts = contacts.data?.records;
                    contacts = contacts?.map((l: any) => unifyContact(l));
                    res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: contacts });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch leads', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createContact(req, res) {
            try {
                const contactData = req.body as UnifiedContact;
                const connection = res.locals.connection;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const contact = disunifyContact(contactData, thirdPartyId);
                console.log('Revert::CREATE CONTACT', tenantId, contact, thirdPartyId);
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
                    res.send({
                        status: 'ok',
                        message: 'Hubspot contact created',
                        result: contact,
                    });
                } else if (thirdPartyId === 'zohocrm') {
                    await axios({
                        method: 'post',
                        url: `https://www.zohoapis.com/crm/v3/Contacts`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                        data: JSON.stringify(contact),
                    });
                    res.send({ status: 'ok', message: 'Zoho contact created', result: contact });
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
                    res.send({
                        status: 'ok',
                        message: 'SFDC contact created',
                        result: contactCreated.data,
                    });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not create lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateContact(req, res) {
            try {
                const connection = res.locals.connection;
                const contactData = req.body as UnifiedContact;
                const contactId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const contact = disunifyContact(contactData, thirdPartyId);
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
                    res.send({
                        status: 'ok',
                        message: 'Hubspot contact updated',
                        result: contact,
                    });
                } else if (thirdPartyId === 'zohocrm') {
                    await axios({
                        method: 'put',
                        url: `https://www.zohoapis.com/crm/v3/Contacts/${contactId}`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                        data: JSON.stringify(contact),
                    });
                    res.send({ status: 'ok', message: 'Zoho contact updated', result: contact });
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
                    res.send({ status: 'ok', message: 'SFDC contact updated', result: contact });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not update lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async searchContacts(req, res) {
            try {
                const connection = res.locals.connection;
                const fields = req.query.fields;
                const searchCriteria: any = req.body.searchCriteria;
                const formattedFields = (fields || '').split('').filter(Boolean);
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::SEARCH CONTACT', tenantId, searchCriteria);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        let contacts: any = await axios({
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
                                    'phone',
                                    'email',
                                    'lastname',
                                    'hs_object_id',
                                    ...formattedFields,
                                ],
                            }),
                        });
                        contacts = contacts.data.results as any[];
                        contacts = contacts?.map((l: any) => unifyContact({ ...l, ...l?.properties }));
                        res.send({
                            status: 'ok',
                            results: contacts,
                        });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        let contacts: any = await axios({
                            method: 'get',
                            url: `https://www.zohoapis.com/crm/v3/Contacts/search?criteria=${searchCriteria}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                        });
                        contacts = contacts.data.data;
                        contacts = contacts?.map((l: any) => unifyContact(l));
                        res.send({ status: 'ok', results: contacts });
                        break;
                    }
                    case TP_ID.sfdc: {
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

                        res.send({ status: 'ok', results: contacts });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const instanceUrl = connection.tp_account_url;
                        const result = await axios.get<
                            { data: { items: { item: any; result_score: number }[] } } & PipedrivePagination
                        >(
                            `${instanceUrl}/v1/persons/search?term=${searchCriteria}${
                                formattedFields.length ? `&fields=${formattedFields.join(',')}` : ''
                            }`,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        const contacts = result.data.data.items.map((item) => item.item);
                        const unifiedContacts = contacts?.map((c: any) => unifyContact(c));
                        res.send({ status: 'ok', results: unifiedContacts });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
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

export { contactService };
