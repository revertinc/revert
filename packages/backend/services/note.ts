import axios from 'axios';
import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { disunifyNote, unifyNote } from '../models/unified';
import { ParsedQs } from 'qs';

class NoteService {
    async getUnifiedNote(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const noteId = req.params.id;
        const fields = req.query.fields;
        console.log('Revert::GET NOTE', tenantId, thirdPartyId, thirdPartyToken, noteId);
        if (thirdPartyId === 'hubspot') {
            let note: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/notes/${noteId}?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            note = ([note.data] as any[])?.[0];
            note = unifyNote({ ...note, ...note?.properties });
            return {
                result: { ...note, ...note?.properties },
            };
        } else if (thirdPartyId === 'zohocrm') {
            const notes = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Notes/${noteId}?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            let note = unifyNote(notes.data.data?.[0]);
            return { result: note };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            const notes = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/sobjects/Note/${noteId}`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            let note = unifyNote(notes.data);
            return { result: note };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async getUnifiedNotes(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const fields = req.query.fields;
        console.log('Revert::GET ALL NOTE', tenantId, thirdPartyId, thirdPartyToken);
        if (thirdPartyId === 'hubspot') {
            let notes: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/notes?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            notes = notes.data.results as any[];
            notes = notes?.map((l: any) => unifyNote({ ...l, ...l?.properties }));
            return {
                results: notes,
            };
        } else if (thirdPartyId === 'zohocrm') {
            let notes: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Notes?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            notes = notes.data.data;
            notes = notes?.map((l: any) => unifyNote(l));
            return { results: notes };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            // TODO: Handle "ALL" for Hubspot & Zoho
            const query =
                !fields || fields === 'ALL'
                    ? 'SELECT+fields(all)+from+Note+limit+200'
                    : `SELECT+${(fields as string).split(',').join('+,+')}+from+Note`;
            let notes: any = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/query/?q=${query}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            notes = notes.data?.records;
            notes = notes?.map((l: any) => unifyNote(l));
            return { results: notes };
        } else {
            return { error: 'Unrecognized CRM' };
        }
    }
    async searchUnifiedNotes(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const searchCriteria = req.body.searchCriteria;
        const fields = String(req.query.fields || '').split(',');
        console.log('Revert::SEARCH NOTE', tenantId, searchCriteria, fields);
        if (thirdPartyId === 'hubspot') {
            let notes: any = await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/notes/search`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify({
                    ...searchCriteria,
                    properties: ['hs_note_status', 'firstname', 'email', 'lastname', 'hs_object_id', ...fields],
                }),
            });
            notes = notes.data.results as any[];
            notes = notes?.map((l: any) => unifyNote({ ...l, ...l?.properties }));
            return {
                status: 'ok',
                results: notes,
            };
        } else if (thirdPartyId === 'zohocrm') {
            let notes: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/notes/search?criteria=${searchCriteria}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            notes = notes.data.data;
            notes = notes?.map((l: any) => unifyNote(l));
            return { status: 'ok', results: notes };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            let notes: any = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/search?q=${searchCriteria}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            notes = notes?.data?.searchRecords;
            notes = notes?.map((l: any) => unifyNote(l));
            return { status: 'ok', results: notes };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async createNote(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const note = disunifyNote(req.body, thirdPartyId);
        console.log('Revert::CREATE NOTE', tenantId, note);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/notes/`,
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
                url: `https://www.zohoapis.com/crm/v3/notes`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(note),
            });
            return { status: 'ok', message: 'Zoho note created', result: note };
        } else if (thirdPartyId === 'sfdc') {
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
    async updateNote(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const note = disunifyNote(req.body, thirdPartyId);
        const noteId = req.params.id;
        console.log('Revert::UPDATE NOTE', tenantId, note, noteId);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'patch',
                url: `https://api.hubapi.com/crm/v3/objects/notes/${noteId}`,
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
                url: `https://www.zohoapis.com/crm/v3/notes/${noteId}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(note),
            });
            return { status: 'ok', message: 'Zoho note updated', result: note };
        } else if (thirdPartyId === 'sfdc') {
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
            return { status: 'ok', message: 'SFDC note updated', result: note };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
}

export default new NoteService();
