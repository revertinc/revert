import axios from 'axios';
import { UnifiedContact, disunifyContact, unifyContact } from '../models/unified/contact';
import { TP_ID, connections } from '@prisma/client';
import { PipedrivePagination } from '../constants/pipedrive';
import { NotFoundError } from '../generated/typescript/api/resources/common';

class ContactService {
    async getUnifiedContact({
        connection,
        contactId,
        fields,
    }: {
        connection: connections;
        contactId: string;
        fields?: string;
    }): Promise<{
        status: 'ok';
        result: UnifiedContact;
    }> {
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
            return { status: 'ok', result: contact };
        } else if (thirdPartyId === 'zohocrm') {
            let contact: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Contacts/${contactId}?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            contact = unifyContact(contact.data.data?.[0]);
            return { status: 'ok', result: contact };
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
            return { status: 'ok', result: contact };
        } else {
            throw new NotFoundError({ error: 'Unrecognized CRM' });
        }
    }
    async getUnifiedContacts({
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
        results: UnifiedContact[];
    }> {
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
            return {
                status: 'ok',
                next: nextCursor,
                previous: undefined, // Field not supported by Hubspot.
                results: contacts,
            };
        } else if (thirdPartyId === 'zohocrm') {
            const pagingString = `${pageSize ? `&per_page=${pageSize}` : ''}${cursor ? `&page_token=${cursor}` : ''}`;
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
            return { status: 'ok', next: nextCursor, previous: prevCursor, results: contacts };
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
            return { status: 'ok', next: nextCursor, previous: prevCursor, results: contacts };
        } else {
            throw new NotFoundError({ error: 'Unrecognized CRM' });
        }
    }
    async searchUnifiedContacts({
        connection,
        searchCriteria,
        fields,
    }: {
        connection: connections;
        searchCriteria: any;
        fields?: string;
    }): Promise<{
        status: 'ok';
        results: UnifiedContact[];
    }> {
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
                return {
                    status: 'ok',
                    results: contacts,
                };
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
                return { status: 'ok', results: contacts };
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

                return { status: 'ok', results: contacts };
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
                return { status: 'ok', results: unifiedContacts };
            }
            default: {
                throw new NotFoundError({ error: 'Unrecognized CRM' });
            }
        }
    }
    async createContact({
        connection,
        contactData,
    }: {
        contactData: UnifiedContact;
        connection: connections;
    }): Promise<{
        status: 'ok';
        result: any;
        message: string;
    }> {
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
            throw new NotFoundError({ error: 'Unrecognized CRM' });
        }
    }
    async updateContact({
        connection,
        contactData,
        contactId,
    }: {
        contactData: UnifiedContact;
        connection: connections;
        contactId: string;
    }): Promise<{
        status: 'ok';
        result: any;
        message: string;
    }> {
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
            return {
                status: 'ok',
                message: 'Hubspot contact updated',
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
            throw new NotFoundError({ error: 'Unrecognized CRM' });
        }
    }
}

export default new ContactService();
