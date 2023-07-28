import axios from 'axios';

import { EventService } from '../../generated/typescript/api/resources/crm/resources/event/service/EventService';
import { InternalServerError } from '../../generated/typescript/api/resources/common';
import { NotFoundError } from '../../generated/typescript/api/resources/common';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import logError from '../../helpers/logError';
import revertAuthMiddleware from '../../helpers/authMiddleware';
import { UnifiedEvent, disunifyEvent, unifyEvent } from '../../models/unified';

const eventService = new EventService(
    {
        async getEvent(req, res) {
            try {
                const connection = res.locals.connection;
                const eventId = req.params.id;
                const fields = req.query.fields;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::GET EVENT', tenantId, thirdPartyId, thirdPartyToken, eventId);
                if (thirdPartyId === 'hubspot') {
                    const formattedFields = [
                        ...String(fields || '').split(','),
                        'hs_meeting_title',
                        'hs_meeting_body',
                        'hs_meeting_start_time',
                        'hs_meeting_end_time',
                        'hs_meeting_location',
                        'hs_activity_type',
                        'hs_object_id',
                    ];
                    let event: any = await axios({
                        method: 'get',
                        url: `https://api.hubapi.com/crm/v3/objects/meetings/${eventId}?properties=${formattedFields}`,
                        headers: {
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                    });
                    event = ([event.data] as any[])?.[0];
                    event = unifyEvent({ ...event, ...event?.properties });
                    res.send({ status: 'ok', result: event });
                } else if (thirdPartyId === 'zohocrm') {
                    const events = await axios({
                        method: 'get',
                        url: `https://www.zohoapis.com/crm/v3/Events/${eventId}?fields=${fields}`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                    });
                    let event = unifyEvent(events.data.data?.[0]);
                    res.send({ status: 'ok', result: event });
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
                    res.send({ status: 'ok', result: event });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch lead', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getEvents(req, res) {
            try {
                const connection = res.locals.connection;
                const fields = req.query.fields;
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::GET ALL EVENT', tenantId, thirdPartyId, thirdPartyToken);
                if (thirdPartyId === 'hubspot') {
                    const formattedFields = [
                        ...String(fields || '').split(','),
                        'hs_meeting_title',
                        'hs_meeting_body',
                        'hs_meeting_start_time',
                        'hs_meeting_end_time',
                        'hs_meeting_location',
                        'hs_activity_type',
                        'hs_object_id',
                    ];
                    const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${cursor ? `&after=${cursor}` : ''}`;
                    let events: any = await axios({
                        method: 'get',
                        url: `https://api.hubapi.com/crm/v3/objects/meetings?properties=${formattedFields}&${pagingString}`,
                        headers: {
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                    });
                    const nextCursor = events.data?.paging?.next?.after || undefined;
                    events = events.data.results as any[];
                    events = events?.map((l: any) => unifyEvent({ ...l, ...l?.properties }));
                    res.send({
                        status: 'ok',
                        next: nextCursor,
                        previous: undefined, // Field not supported by Hubspot.
                        results: events,
                    });
                } else if (thirdPartyId === 'zohocrm') {
                    const pagingString = `${pageSize ? `&per_page=${pageSize}` : ''}${
                        cursor ? `&page_token=${cursor}` : ''
                    }`;
                    let events: any = await axios({
                        method: 'get',
                        url: `https://www.zohoapis.com/crm/v3/Events?fields=${fields}${pagingString}`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                    });
                    const nextCursor = events.data?.info?.next_page_token || undefined;
                    const prevCursor = events.data?.info?.previous_page_token || undefined;
                    events = events.data.data;
                    events = events?.map((l: any) => unifyEvent(l));
                    res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: events });
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
                    const nextCursor = pageSize
                        ? String(events.data?.totalSize + (parseInt(String(cursor)) || 0))
                        : undefined;
                    const prevCursor =
                        cursor && parseInt(String(cursor)) > 0
                            ? String(parseInt(String(cursor)) - events.data?.totalSize)
                            : undefined;
                    events = events.data?.records;
                    events = events?.map((l: any) => unifyEvent(l));
                    res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: events });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch leads', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createEvent(req, res) {
            try {
                const eventData = req.body as UnifiedEvent;
                const connection = res.locals.connection;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const event = disunifyEvent(eventData, thirdPartyId);
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
                    res.send({ status: 'ok', message: 'Hubspot event created', result: event });
                } else if (thirdPartyId === 'zohocrm') {
                    await axios({
                        method: 'post',
                        url: `https://www.zohoapis.com/crm/v3/Events`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                        data: JSON.stringify(event),
                    });
                    res.send({ status: 'ok', message: 'Zoho event created', result: event });
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
                    res.send({ status: 'ok', message: 'SFDC event created', result: eventCreated.data });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not create lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateEvent(req, res) {
            try {
                const connection = res.locals.connection;
                const eventData = req.body as UnifiedEvent;
                const eventId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const event = disunifyEvent(eventData, thirdPartyId);

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
                    res.send({ status: 'ok', message: 'Hubspot event updated', result: event });
                } else if (thirdPartyId === 'zohocrm') {
                    await axios({
                        method: 'put',
                        url: `https://www.zohoapis.com/crm/v3/Events/${eventId}`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                        data: JSON.stringify(event),
                    });
                    res.send({ status: 'ok', message: 'Zoho event updated', result: event });
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
                    res.send({ status: 'ok', message: 'SFDC event updated', result: event });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not update lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async searchEvents(req, res) {
            try {
                const connection = res.locals.connection;
                const fields = req.query.fields;
                const searchCriteria: any = req.body.searchCriteria;
                const formattedFields = String(fields || '').split(',');
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
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
                            properties: [
                                'hs_meeting_title',
                                'hs_meeting_body',
                                'hs_meeting_start_time',
                                'hs_meeting_end_time',
                                'hs_meeting_location',
                                'hs_activity_type',
                                'hs_object_id',
                                ...formattedFields,
                            ],
                        }),
                    });
                    events = events.data.results as any[];
                    events = events?.map((l: any) => unifyEvent({ ...l, ...l?.properties }));
                    res.send({ status: 'ok', results: events });
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
                    res.send({ status: 'ok', results: events });
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
                    res.send({ status: 'ok', results: events });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
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

export { eventService };
