import axios from 'axios';
import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { disunifyEvent, unifyEvent } from '../models/unified';
import { ParsedQs } from 'qs';

class EventService {
    async getUnifiedEvent(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const eventId = req.params.id;
        const fields = req.query.fields;
        console.log('Revert::GET EVENT', tenantId, thirdPartyId, thirdPartyToken, eventId);
        if (thirdPartyId === 'hubspot') {
            let event: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/meetings/${eventId}?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            event = ([event.data] as any[])?.[0];
            event = unifyEvent({ ...event, ...event?.properties });
            return {
                result: event,
            };
        } else if (thirdPartyId === 'zohocrm') {
            const events = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Events/${eventId}?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            let event = unifyEvent(events.data.data?.[0]);
            return { result: event };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            const events = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/sobjects/Event/${eventId}`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            let event = unifyEvent(events.data);
            return { result: event };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async getUnifiedEvents(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const fields = req.query.fields;
        const pageSize = parseInt(String(req.query.pageSize));
        const cursor = req.query.cursor;
        console.log('Revert::GET ALL EVENT', tenantId, thirdPartyId, thirdPartyToken);
        if (thirdPartyId === 'hubspot') {
            const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${cursor ? `&after=${cursor}` : ''}`;
            let events: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/meetings?properties=${fields}&${pagingString}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            const nextCursor = events.data?.paging?.next?.after || null;
            events = events.data.results as any[];
            events = events?.map((l: any) => unifyEvent({ ...l, ...l?.properties }));
            return {
                next: nextCursor,
                previous: null, // Field not supported by Hubspot.
                results: events,
            };
        } else if (thirdPartyId === 'zohocrm') {
            const pagingString = `${pageSize ? `&per_page=${pageSize}` : ''}${cursor ? `&page_token=${cursor}` : ''}`;
            let events: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Events?fields=${fields}${pagingString}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            const nextCursor = events.data?.info?.next_page_token || null;
            const prevCursor = events.data?.info?.previous_page_token || null;
            events = events.data.data;
            events = events?.map((l: any) => unifyEvent(l));
            return { next: nextCursor, previous: prevCursor, results: events };
        } else if (thirdPartyId === 'sfdc') {
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
                    ? `SELECT+fields(all)+from+Event+${pagingString}`
                    : `SELECT+${(fields as string).split(',').join('+,+')}+from+Event+${pagingString}`;
            let events: any = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/query/?q=${query}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            const nextCursor = pageSize ? String(events.data?.totalSize + (parseInt(String(cursor)) || 0)) : null;
            const prevCursor =
                cursor && parseInt(String(cursor)) > 0
                    ? String(parseInt(String(cursor)) - events.data?.totalSize)
                    : null;
            events = events.data?.records;
            events = events?.map((l: any) => unifyEvent(l));
            return { next: nextCursor, previous: prevCursor, results: events };
        } else {
            return { error: 'Unrecognized CRM' };
        }
    }
    async searchUnifiedEvents(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const searchCriteria = req.body.searchCriteria;
        const fields = String(req.query.fields || '').split(',');
        console.log('Revert::SEARCH EVENT', tenantId, searchCriteria, fields);
        if (thirdPartyId === 'hubspot') {
            let events: any = await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/meetings/search`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify({
                    ...searchCriteria,
                    properties: ['hs_event_status', 'firstname', 'email', 'lastname', 'hs_object_id', ...fields],
                }),
            });
            events = events.data.results as any[];
            events = events?.map((l: any) => unifyEvent({ ...l, ...l?.properties }));
            return {
                status: 'ok',
                results: events,
            };
        } else if (thirdPartyId === 'zohocrm') {
            let events: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Events/search?criteria=${searchCriteria}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            events = events.data.data;
            events = events?.map((l: any) => unifyEvent(l));
            return { status: 'ok', results: events };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            let events: any = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/search?q=${searchCriteria}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            events = events?.data?.searchRecords;
            events = events?.map((l: any) => unifyEvent(l));
            return { status: 'ok', results: events };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async createEvent(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const event = disunifyEvent(req.body, thirdPartyId);
        console.log('Revert::CREATE EVENT', tenantId, event);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/meetings/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(event),
            });
            return {
                status: 'ok',
                message: 'Hubspot event created',
                result: event,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'post',
                url: `https://www.zohoapis.com/crm/v3/Events`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(event),
            });
            return { status: 'ok', message: 'Zoho event created', result: event };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            const eventCreated = await axios({
                method: 'post',
                url: `${instanceUrl}/services/data/v56.0/sobjects/Event/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(event),
            });
            return {
                status: 'ok',
                message: 'SFDC event created',
                result: eventCreated.data,
            };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async updateEvent(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const event = disunifyEvent(req.body, thirdPartyId);
        const eventId = req.params.id;
        console.log('Revert::UPDATE EVENT', tenantId, event, eventId);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'patch',
                url: `https://api.hubapi.com/crm/v3/objects/meetings/${eventId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(event),
            });
            return {
                status: 'ok',
                message: 'Hubspot event updated',
                result: event,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'put',
                url: `https://www.zohoapis.com/crm/v3/Events/${eventId}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(event),
            });
            return { status: 'ok', message: 'Zoho event updated', result: event };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            await axios({
                method: 'patch',
                url: `${instanceUrl}/services/data/v56.0/sobjects/Event/${eventId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(event),
            });
            return { status: 'ok', message: 'SFDC event updated', result: event };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
}

export default new EventService();
