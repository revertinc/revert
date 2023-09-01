import axios from 'axios';
import { TP_ID } from '@prisma/client';

import { NoteService } from '../../generated/typescript/api/resources/crm/resources/note/service/NoteService';
import { InternalServerError } from '../../generated/typescript/api/resources/common';
import { NotFoundError } from '../../generated/typescript/api/resources/common';
import logError from '../../helpers/logError';
import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { isStandardError } from '../../helpers/error';
import { unifyObject, disunifyObject } from '../../helpers/crm/transform';
import { UnifiedNote } from '../../models/unified';
import { PipedriveNote, PipedrivePagination } from '../../constants/pipedrive';
import { StandardObjects } from '../../constants/common';

const objType = StandardObjects.note;

const noteService = new NoteService(
    {
        async getNote(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const noteId = req.params.id;
                const fields = req.query.fields;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::GET NOTE', tenantId, thirdPartyId, thirdPartyToken, noteId);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        const formattedFields = [...String(fields || '').split(','), 'hs_note_body'];
                        let note: any = await axios({
                            method: 'get',
                            url: `https://api.hubapi.com/crm/v3/objects/notes/${noteId}?properties=${formattedFields}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        note = ([note.data] as any[])?.[0];
                        note = await unifyObject<any, UnifiedNote>({
                            obj: { ...note, ...note?.properties },
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: { ...note, ...note?.properties } });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        const notes = await axios({
                            method: 'get',
                            url: `https://www.zohoapis.com/crm/v3/Notes/${noteId}?fields=${fields}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                        });
                        let note = await unifyObject<any, UnifiedNote>({
                            obj: notes.data.data?.[0],
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: note });
                        break;
                    }
                    case TP_ID.sfdc: {
                        const instanceUrl = connection.tp_account_url;
                        const notes = await axios({
                            method: 'get',
                            url: `${instanceUrl}/services/data/v56.0/sobjects/Note/${noteId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        let note = await unifyObject<any, UnifiedNote>({
                            obj: notes.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: note });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const result = await axios.get<{ data: Partial<PipedriveNote> } & PipedrivePagination>(
                            `${connection.tp_account_url}/v1/notes/${noteId}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        const note = result.data;
                        res.send({
                            status: 'ok',
                            result: await unifyObject<any, UnifiedNote>({
                                obj: note.data,
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
        async getNotes(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const fields = req.query.fields;
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::GET ALL NOTE', tenantId, thirdPartyId, thirdPartyToken);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        const formattedFields = [...String(fields || '').split(','), 'hs_note_body'];
                        const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&after=${cursor}` : ''
                        }`;
                        let notes: any = await axios({
                            method: 'get',
                            url: `https://api.hubapi.com/crm/v3/objects/notes?properties=${formattedFields}&${pagingString}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        const nextCursor = notes.data?.paging?.next?.after || undefined;
                        notes = notes.data.results as any[];
                        notes = await Promise.all(
                            notes?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedNote>({
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
                            results: notes,
                        });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        const pagingString = `${pageSize ? `&per_page=${pageSize}` : ''}${
                            cursor ? `&page_token=${cursor}` : ''
                        }`;
                        let notes: any = await axios({
                            method: 'get',
                            url: `https://www.zohoapis.com/crm/v3/Notes?fields=${fields}${pagingString}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                        });
                        const nextCursor = notes.data?.info?.next_page_token || undefined;
                        const prevCursor = notes.data?.info?.previous_page_token || undefined;
                        notes = notes.data.data;
                        notes = await Promise.all(
                            notes?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedNote>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: notes });
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
                        // TODO: Handle "ALL" for Hubspot & Zoho
                        const query =
                            !fields || fields === 'ALL'
                                ? `SELECT+fields(all)+from+Note+${pagingString}`
                                : `SELECT+${(fields as string).split(',').join('+,+')}+from+Note+${pagingString}`;
                        let notes: any = await axios({
                            method: 'get',
                            url: `${instanceUrl}/services/data/v56.0/query/?q=${query}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        const nextCursor = pageSize
                            ? String(notes.data?.totalSize + (parseInt(String(cursor)) || 0))
                            : undefined;
                        const prevCursor =
                            cursor && parseInt(String(cursor)) > 0
                                ? String(parseInt(String(cursor)) - notes.data?.totalSize)
                                : undefined;
                        notes = notes.data?.records;
                        notes = await Promise.all(
                            notes?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedNote>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: notes });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&start=${cursor}` : ''
                        }`;
                        const result = await axios.get<{ data: Partial<PipedriveNote>[] } & PipedrivePagination>(
                            `${connection.tp_account_url}/v1/notes?${pagingString}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        const nextCursor = String(result.data?.additional_data?.pagination.next_start) || undefined;
                        const prevCursor = undefined;
                        const notes = result.data.data;
                        const unifiedNotes = await Promise.all(
                            notes?.map(
                                async (d) =>
                                    await unifyObject<any, UnifiedNote>({
                                        obj: d,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: unifiedNotes });
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
        async createNote(req, res) {
            try {
                const noteData = req.body as UnifiedNote;
                const connection = res.locals.connection;
                const account = res.locals.account;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const note = await disunifyObject<UnifiedNote>({
                    obj: noteData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                console.log('Revert::CREATE NOTE', tenantId, note);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        const response = await axios({
                            method: 'post',
                            url: `https://api.hubapi.com/crm/v3/objects/notes/`,
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(note),
                        });
                        res.send({
                            status: 'ok',
                            message: 'Hubspot note created',
                            result: { id: response.data?.id, ...note },
                        });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        await axios({
                            method: 'post',
                            url: `https://www.zohoapis.com/crm/v3/Notes`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(note),
                        });
                        res.send({ status: 'ok', message: 'Zoho note created', result: note });
                        break;
                    }
                    case TP_ID.sfdc: {
                        const instanceUrl = connection.tp_account_url;
                        const noteCreated = await axios({
                            method: 'post',
                            url: `${instanceUrl}/services/data/v56.0/sobjects/Note/`,
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(note),
                        });
                        res.send({ status: 'ok', message: 'SFDC note created', result: noteCreated.data });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const instanceUrl = connection.tp_account_url;
                        const noteCreated = await axios.post<{ data: any }>(`${instanceUrl}/v1/notes`, note, {
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        res.send({
                            status: 'ok',
                            message: 'Pipedrive note created',
                            result: {
                                ...noteCreated.data.data,
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
                console.error('Could not create lead', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateNote(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const noteData = req.body as UnifiedNote;
                const noteId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const note = await disunifyObject<UnifiedNote>({
                    obj: noteData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                console.log('Revert::UPDATE NOTE', tenantId, note, noteId);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        await axios({
                            method: 'patch',
                            url: `https://api.hubapi.com/crm/v3/objects/notes/${noteId}`,
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(note),
                        });
                        res.send({ status: 'ok', message: 'Hubspot note updated', result: note });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        await axios({
                            method: 'put',
                            url: `https://www.zohoapis.com/crm/v3/Notes/${noteId}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(note),
                        });
                        res.send({ status: 'ok', message: 'Zoho note updated', result: note });
                        break;
                    }
                    case TP_ID.sfdc: {
                        const instanceUrl = connection.tp_account_url;
                        await axios({
                            method: 'patch',
                            url: `${instanceUrl}/services/data/v56.0/sobjects/Note/${noteId}`,
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(note),
                        });
                        res.send({ status: 'ok', message: 'SFDC note updated', result: note });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const noteUpdated = await axios.put<{ data: Partial<PipedriveNote> }>(
                            `${connection.tp_account_url}/v1/notes/${noteId}`,
                            note,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        res.send({
                            status: 'ok',
                            message: 'Pipedrive note updated',
                            result: {
                                ...noteUpdated.data.data,
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
        async searchNotes(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const fields = req.query.fields;
                const searchCriteria: any = req.body.searchCriteria;
                const formattedFields = (fields || '').split('').filter(Boolean);
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::SEARCH NOTE', tenantId, searchCriteria, fields);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        let notes: any = await axios({
                            method: 'post',
                            url: `https://api.hubapi.com/crm/v3/objects/notes/search`,
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify({
                                ...searchCriteria,
                                properties: ['hs_note_body', 'hs_object_id', ...formattedFields],
                            }),
                        });
                        notes = notes.data.results as any[];
                        notes = await Promise.all(
                            notes?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedNote>({
                                        obj: { ...l, ...l?.properties },
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', results: notes });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        let notes: any = await axios({
                            method: 'get',
                            url: `https://www.zohoapis.com/crm/v3/notes/search?criteria=${searchCriteria}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                        });
                        notes = notes.data.data;
                        notes = await Promise.all(
                            notes?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedNote>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', results: notes });
                        break;
                    }
                    case TP_ID.sfdc: {
                        const instanceUrl = connection.tp_account_url;
                        let notes: any = await axios({
                            method: 'get',
                            url: `${instanceUrl}/services/data/v56.0/search?q=${searchCriteria}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        notes = notes?.data?.searchRecords;
                        notes = await Promise.all(
                            notes?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedNote>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', results: notes });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        throw new NotFoundError({ error: 'Method not allowed' });
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

export { noteService };
