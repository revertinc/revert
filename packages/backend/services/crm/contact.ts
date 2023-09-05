import axios from 'axios';
import { TP_ID } from '@prisma/client';

import { ContactService } from '../../generated/typescript/api/resources/crm/resources/contact/service/ContactService';
import { BadRequestError, InternalServerError } from '../../generated/typescript/api/resources/common';
import { NotFoundError } from '../../generated/typescript/api/resources/common';
import { PipedriveContact, PipedrivePagination } from '../../constants/pipedrive';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import revertAuthMiddleware from '../../helpers/authMiddleware';
import { isStandardError } from '../../helpers/error';
import { mapPipedriveObjectCustomFields } from '../../helpers/crm';
import { unifyObject, disunifyObject } from '../../helpers/crm/transform';
import { UnifiedContact } from '../../models/unified/contact';
import { StandardObjects } from '../../constants/common';

const objType = StandardObjects.contact;

const contactService = new ContactService(
    {
        async getContact(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const contactId = req.params.id;
                const fields = req.query.fields;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo(
                    'Revert::GET CONTACT',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    contactId
                );

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
                        let contact: any = await axios({
                            method: 'get',
                            url: `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=${formattedFields}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        contact = await unifyObject<any, UnifiedContact>({
                            obj: { ...contact.data, ...contact.data?.properties },
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: contact });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        let contact: any = await axios({
                            method: 'get',
                            url: `https://www.zohoapis.com/crm/v3/Contacts/${contactId}${
                                fields ? `?fields=${fields}` : ''
                            }`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                        });
                        contact = await unifyObject<any, UnifiedContact>({
                            obj: contact.data.data?.[0],
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: contact });
                        break;
                    }
                    case TP_ID.sfdc: {
                        const instanceUrl = connection.tp_account_url;
                        let contact: any = await axios({
                            method: 'get',
                            url: `${instanceUrl}/services/data/v56.0/sobjects/Contact/${contactId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        contact = contact.data;
                        contact = await unifyObject<any, UnifiedContact>({
                            obj: contact,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: contact });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const result = await axios.get<{ data: Partial<PipedriveContact> | any } & PipedrivePagination>(
                            `${connection.tp_account_url}/v1/persons/${contactId}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        const contact = result.data;
                        const personFields = (
                            await axios.get(`${connection.tp_account_url}/v1/personFields`, {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            })
                        ).data.data;
                        const mappedContact = mapPipedriveObjectCustomFields({
                            object: contact.data,
                            objectFields: personFields,
                        });
                        res.send({
                            status: 'ok',
                            result: await unifyObject<any, UnifiedContact>({
                                obj: mappedContact,
                                tpId: thirdPartyId,
                                objType,
                                tenantSchemaMappingId: connection.schema_mapping_id,
                                accountFieldMappingConfig: account.accountFieldMappingConfig,
                            }),
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch lead', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getContacts(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const fields = req.query.fields;
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo(
                    'Revert::GET ALL CONTACTS',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken
                );

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
                        let contacts: any = await axios({
                            method: 'get',
                            url: `https://api.hubapi.com/crm/v3/objects/contacts?properties=${formattedFields}&${pagingString}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        const nextCursor = contacts.data?.paging?.next?.after || undefined;
                        contacts = contacts.data.results as any[];
                        contacts = await Promise.all(
                            contacts?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedContact>({
                                        obj: { ...l, ...l?.properties },
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({
                            status: 'ok',
                            next: nextCursor,
                            previous: undefined, // Field not supported by Hubspot.
                            results: contacts,
                        });
                        break;
                    }
                    case TP_ID.zohocrm: {
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
                        contacts = await Promise.all(
                            contacts?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedContact>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: contacts });
                        break;
                    }
                    case TP_ID.sfdc: {
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
                        contacts = await Promise.all(
                            contacts?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedContact>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: contacts });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&start=${cursor}` : ''
                        }`;
                        const result = await axios.get<{ data: Partial<PipedriveContact>[] } & PipedrivePagination>(
                            `${connection.tp_account_url}/v1/persons?${pagingString}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        const nextCursor = String(result.data?.additional_data?.pagination.next_start) || undefined;
                        const prevCursor = undefined;
                        const contacts = result.data.data;
                        const personFields = (
                            await axios.get(`${connection.tp_account_url}/v1/personFields`, {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            })
                        ).data.data;
                        const mappedContacts = contacts.map((c: any) =>
                            mapPipedriveObjectCustomFields({ object: c, objectFields: personFields })
                        );
                        const unifiedContacts = await Promise.all(
                            mappedContacts?.map(
                                async (d) =>
                                    await unifyObject<any, UnifiedContact>({
                                        obj: d,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: unifiedContacts });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch leads', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createContact(req, res) {
            try {
                const contactData = req.body as UnifiedContact;
                const connection = res.locals.connection;
                const account = res.locals.account;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const contact = await disunifyObject<UnifiedContact>({
                    obj: contactData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                console.log('Revert::CREATE CONTACT', connection.app?.env?.accountId, tenantId, contact, thirdPartyId);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        const response = await axios({
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
                            result: { id: response.data?.id, ...contact },
                        });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        if (contactData.associations?.dealId && !contactData.additional?.Contact_Role) {
                            throw new BadRequestError({
                                error: 'Required field for association is missing: (additional.Contact_Role)',
                            });
                        }
                        const result = await axios({
                            method: 'post',
                            url: `https://www.zohoapis.com/crm/v3/Contacts`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(contact),
                        });
                        if (contactData.associations?.dealId) {
                            await axios.put(
                                `https://www.zohoapis.com/crm/v3/Contacts/${result.data?.data?.[0]?.details?.id}/Deals/${contactData.associations.dealId}`,
                                {
                                    data: [
                                        {
                                            Contact_Role: contactData.additional.Contact_Role,
                                        },
                                    ],
                                },
                                {
                                    headers: {
                                        authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                                    },
                                }
                            );
                        }
                        res.send({ status: 'ok', message: 'Zoho contact created', result: contact });
                        break;
                    }
                    case TP_ID.sfdc: {
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
                        if (contactData.associations?.dealId) {
                            await axios.post(
                                `${instanceUrl}/services/data/v56.0/sobjects/OpportunityContactRole/`,
                                {
                                    ContactId: contactCreated.data?.id,
                                    OpportunityId: contactData.associations.dealId,
                                },
                                {
                                    headers: {
                                        'content-type': 'application/json',
                                        authorization: `Bearer ${thirdPartyToken}`,
                                    },
                                }
                            );
                        }
                        res.send({
                            status: 'ok',
                            message: 'SFDC contact created',
                            result: contactCreated.data,
                        });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const instanceUrl = connection.tp_account_url;
                        const pipedriveContact = contact as Partial<PipedriveContact>;
                        const contactCreated = await axios.post<{ data: Partial<PipedriveContact> }>(
                            `${instanceUrl}/v1/persons`,
                            pipedriveContact,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        res.send({
                            status: 'ok',
                            message: 'Pipedrive contact created',
                            result: {
                                ...contactCreated.data.data,
                            },
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not create contact', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateContact(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const contactData = req.body as UnifiedContact;
                const contactId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const contact = await disunifyObject<UnifiedContact>({
                    obj: contactData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                console.log('Revert::UPDATE CONTACT', connection.app?.env?.accountId, tenantId, contact, contactId);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
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
                        break;
                    }
                    case TP_ID.zohocrm: {
                        await axios({
                            method: 'put',
                            url: `https://www.zohoapis.com/crm/v3/Contacts/${contactId}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(contact),
                        });
                        res.send({ status: 'ok', message: 'Zoho contact updated', result: contact });
                        break;
                    }
                    case TP_ID.sfdc: {
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
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const contactUpdated = await axios.put<{ data: Partial<PipedriveContact> }>(
                            `${connection.tp_account_url}/v1/persons/${contactId}`,
                            contact,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        res.send({
                            status: 'ok',
                            message: 'Pipedrive contact updated',
                            result: {
                                ...contactUpdated.data.data,
                            },
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not update lead', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async searchContacts(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const fields = req.query.fields;
                const searchCriteria: any = req.body.searchCriteria;
                const formattedFields = (fields || '').split('').filter(Boolean);
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo('Revert::SEARCH CONTACT', connection.app?.env?.accountId, tenantId, searchCriteria);

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
                        contacts = await Promise.all(
                            contacts?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedContact>({
                                        obj: { ...l, ...l?.properties },
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
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
                        contacts = await Promise.all(
                            contacts?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedContact>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
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
                        contacts = await Promise.all(
                            contacts?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedContact>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );

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
                        const personFields = (
                            await axios.get(`${connection.tp_account_url}/v1/personFields`, {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            })
                        ).data.data;
                        const mappedContacts = contacts.map((c: any) =>
                            mapPipedriveObjectCustomFields({ object: c, objectFields: personFields })
                        );
                        const unifiedContacts = await Promise.all(
                            mappedContacts?.map(
                                async (c: any) =>
                                    await unifyObject<any, UnifiedContact>({
                                        obj: c,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
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
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { contactService };
