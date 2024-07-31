import axios from 'axios';
import { TP_ID } from '@prisma/client';

import { EventService } from '../../generated/typescript/api/resources/crm/resources/event/service/EventService';
import { InternalServerError } from '../../generated/typescript/api/resources/common';
import { NotFoundError } from '../../generated/typescript/api/resources/common';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import revertAuthMiddleware from '../../helpers/authMiddleware';
import { isStandardError } from '../../helpers/error';
import { disunifyObject, unifyObject } from '../../helpers/crm/transform';
import { UnifiedEvent } from '../../models/unified';
import { PipedriveEvent, PipedrivePagination } from '../../constants/pipedrive';
import { StandardObjects } from '../../constants/common';
import { getAssociationObjects, isValidAssociationTypeRequestedByUser } from '../../helpers/crm/hubspot';

const objType = StandardObjects.event;

const eventService = new EventService(
    {
        async getEvent(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const eventId = req.params.id;
                const fields = req.query.fields;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const associations = req.query.associations ? req.query.associations.split(',') : [];

                logInfo(
                    'Revert::GET EVENT',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    eventId
                );

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
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
                        const validAssociations = [...associations].filter((item) =>
                            isValidAssociationTypeRequestedByUser(item)
                        );
                        const invalidAssociations = [...associations].filter(
                            (item) =>
                                item !== 'undefined' && item !== 'null' && !isValidAssociationTypeRequestedByUser(item)
                        );

                        const url =
                            `https://api.hubapi.com/crm/v3/objects/meetings/${eventId}?properties=${formattedFields}` +
                            (validAssociations.length > 0 ? `&associations=${validAssociations}` : '');

                        let event: any = await axios({
                            method: 'get',
                            url: url,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        event = ([event.data] as any[])?.[0];
                        const associatedData = await getAssociationObjects(
                            event?.associations,
                            thirdPartyToken,
                            thirdPartyId,
                            connection,
                            account,
                            invalidAssociations
                        );
                        event = await unifyObject<any, UnifiedEvent>({
                            obj: { ...event, ...event?.properties, associations: associatedData },
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: event });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        const events = await axios({
                            method: 'get',
                            url: `https://www.zohoapis.com/crm/v3/Events/${eventId}?fields=${fields}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                        });
                        let event = await unifyObject<any, UnifiedEvent>({
                            obj: events.data.data?.[0],
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: event });
                        break;
                    }
                    case TP_ID.sfdc: {
                        const instanceUrl = connection.tp_account_url;
                        const events = await axios({
                            method: 'get',
                            url: `${instanceUrl}/services/data/v56.0/sobjects/Event/${eventId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        let event = await unifyObject<any, UnifiedEvent>({
                            obj: events.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: event });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const result = await axios.get<{ data: Partial<PipedriveEvent> } & PipedrivePagination>(
                            `${connection.tp_account_url}/v1/activities/${eventId}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        const event = result.data;
                        res.send({
                            status: 'ok',
                            result: await unifyObject<any, UnifiedEvent>({
                                obj: event.data,
                                tpId: thirdPartyId,
                                objType,
                                tenantSchemaMappingId: connection.schema_mapping_id,
                                accountFieldMappingConfig: account.accountFieldMappingConfig,
                            }),
                        });
                        break;
                    }
                    case TP_ID.closecrm: {
                        let meeting: any = await axios({
                            method: 'get',
                            url: `https://api.close.com/api/v1/activity/meeting/${eventId}/`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });

                        meeting = await unifyObject<any, UnifiedEvent>({
                            obj: meeting.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: meeting });
                        break;
                    }
                    case TP_ID.ms_dynamics_365_sales: {
                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/api/data/v9.2/appointments(${eventId})`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                Accept: 'application/json',
                            },
                        });

                        const unifiedEvent = await unifyObject<any, UnifiedEvent>({
                            obj: result.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: unifiedEvent });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch event', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getEvents(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const fields = req.query.fields;
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const associations = req.query.associations ? req.query.associations.split(',') : [];

                logInfo(
                    'Revert::GET ALL EVENT',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken
                );

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
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
                        const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&after=${cursor}` : ''
                        }`;
                        const validAssociations = [...associations].filter((item) =>
                            isValidAssociationTypeRequestedByUser(item)
                        );
                        const invalidAssociations = [...associations].filter(
                            (item) =>
                                item !== 'undefined' && item !== 'null' && !isValidAssociationTypeRequestedByUser(item)
                        );

                        const url =
                            `https://api.hubapi.com/crm/v3/objects/meetings?properties=${formattedFields}${pagingString}` +
                            (validAssociations.length > 0 ? `&associations=${validAssociations}` : '');

                        let events: any = await axios({
                            method: 'get',
                            url: url,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        const nextCursor = events.data?.paging?.next?.after || undefined;
                        events = events.data.results as any[];
                        events = await Promise.all(
                            events?.map(async (l: any) => {
                                const associatedData = await getAssociationObjects(
                                    l?.associations,
                                    thirdPartyToken,
                                    thirdPartyId,
                                    connection,
                                    account,
                                    invalidAssociations
                                );

                                return await unifyObject<any, UnifiedEvent>({
                                    obj: { ...l, ...l?.properties, associations: associatedData },
                                    tpId: thirdPartyId,
                                    objType,
                                    tenantSchemaMappingId: connection.schema_mapping_id,
                                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                                });
                            })
                        );
                        res.send({
                            status: 'ok',
                            next: nextCursor,
                            previous: undefined, // Field not supported by Hubspot.
                            results: events,
                        });
                        break;
                    }
                    case TP_ID.zohocrm: {
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
                        events = await Promise.all(
                            events?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedEvent>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: events });
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
                        events = await Promise.all(
                            events?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedEvent>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: events });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&start=${cursor}` : ''
                        }`;
                        const result = await axios.get<{ data: Partial<PipedriveEvent>[] } & PipedrivePagination>(
                            `${connection.tp_account_url}/v1/activities?type=meeting${pagingString}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        const nextCursor = String(result.data?.additional_data?.pagination.next_start) || undefined;
                        const prevCursor = undefined;
                        const events = result.data.data;
                        const unifiedEvents = await Promise.all(
                            events?.map(
                                async (d) =>
                                    await unifyObject<any, UnifiedEvent>({
                                        obj: d,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: unifiedEvents });
                        break;
                    }
                    case TP_ID.closecrm: {
                        const pagingString = `${pageSize ? `&_limit=${pageSize}` : ''}${
                            cursor ? `&_skip=${cursor}` : ''
                        }`;

                        let meetings: any = await axios({
                            method: 'get',
                            url: `https://api.close.com/api/v1/activity/meeting/?${pagingString}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });
                        const hasMore = meetings.data?.has_more;
                        meetings = meetings.data?.data as any[];
                        meetings = await Promise.all(
                            meetings?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedEvent>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );

                        let cursorVal = parseInt(String(cursor));
                        if (isNaN(cursorVal)) cursorVal = 0;
                        const nextSkipVal = hasMore ? cursorVal + pageSize : undefined;
                        const prevSkipVal = cursorVal > 0 ? String(Math.max(cursorVal - pageSize, 0)) : undefined;

                        res.send({
                            status: 'ok',
                            next: nextSkipVal ? String(nextSkipVal) : undefined,
                            previous: prevSkipVal,
                            results: meetings,
                        });
                        break;
                    }
                    case TP_ID.ms_dynamics_365_sales: {
                        const pagingString = cursor ? encodeURI(cursor).split('?')[1] : '';

                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/api/data/v9.2/appointments?${pagingString}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                Accept: 'application/json',
                                Prefer: pageSize ? `odata.maxpagesize=${pageSize}` : '',
                            },
                        });

                        const unifiedEvents = await Promise.all(
                            result.data.value.map(
                                async (event: any) =>
                                    await unifyObject<any, UnifiedEvent>({
                                        obj: event,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );

                        res.send({
                            status: 'ok',
                            next: result.data['@odata.nextLink'],
                            previous: undefined,
                            results: unifiedEvents,
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch events', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createEvent(req, res) {
            try {
                const eventData = req.body as UnifiedEvent;
                const connection = res.locals.connection;
                const account = res.locals.account;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const event = await disunifyObject<UnifiedEvent>({
                    obj: eventData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                console.log('Revert::CREATE EVENT', connection.app?.env?.accountId, tenantId, event);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        const response = await axios({
                            method: 'post',
                            url: `https://api.hubapi.com/crm/v3/objects/meetings/`,
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(event),
                        });
                        res.send({
                            status: 'ok',
                            message: 'Hubspot event created',
                            result: { id: response.data?.id, ...event },
                        });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        const eventCreated: any = await axios({
                            method: 'post',
                            url: `https://www.zohoapis.com/crm/v3/Events`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(event),
                        });
                        res.send({
                            status: 'ok',
                            message: 'Zoho event created',
                            result: { ...event, details: eventCreated.data.data[0].details },
                        });
                        break;
                    }
                    case TP_ID.sfdc: {
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
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const instanceUrl = connection.tp_account_url;
                        const pipedriveEvent = event as Partial<PipedriveEvent>;
                        const eventCreated = await axios.post<{ data: Partial<PipedriveEvent> }>(
                            `${instanceUrl}/v1/activities`,
                            pipedriveEvent,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        res.send({
                            status: 'ok',
                            message: 'Pipedrive event created',
                            result: {
                                ...eventCreated.data.data,
                            },
                        });
                        break;
                    }
                    case TP_ID.closecrm: {
                        throw new NotFoundError({ error: 'Method not allowed' });
                    }
                    case TP_ID.ms_dynamics_365_sales: {
                        const response = await axios({
                            method: 'post',
                            url: `${connection.tp_account_url}/api/data/v9.2/appointments`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                            data: event,
                        });

                        res.send({
                            status: 'ok',
                            message: 'MS Dynamics 365 Event created.',
                            result: response.data,
                            // result: event,
                        });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not create event', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateEvent(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const eventData = req.body as UnifiedEvent;
                const eventId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const event = await disunifyObject<UnifiedEvent>({
                    obj: eventData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                console.log('Revert::UPDATE EVENT', connection.app?.env?.accountId, tenantId, event, eventId);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
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
                        break;
                    }
                    case TP_ID.zohocrm: {
                        await axios({
                            method: 'put',
                            url: `https://www.zohoapis.com/crm/v3/Events/${eventId}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(event),
                        });
                        res.send({ status: 'ok', message: 'Zoho event updated', result: event });
                        break;
                    }
                    case TP_ID.sfdc: {
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
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const eventUpdated = await axios.put<{ data: Partial<PipedriveEvent> }>(
                            `${connection.tp_account_url}/v1/activities/${eventId}`,
                            event,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        res.send({
                            status: 'ok',
                            message: 'Pipedrive event updated',
                            result: {
                                ...eventUpdated.data.data,
                            },
                        });
                        break;
                    }
                    case TP_ID.closecrm: {
                        throw new NotFoundError({ error: 'Method not allowed' });
                    }
                    case TP_ID.ms_dynamics_365_sales: {
                        const response = await axios({
                            method: 'patch',
                            url: `${connection.tp_account_url}/api/data/v9.2/appointments(${eventId})`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                            data: event,
                        });

                        res.send({
                            status: 'ok',
                            message: 'MS Dynamics 365 Event updated.',
                            result: response.data,
                        });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not update event', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async searchEvents(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const fields = req.query.fields;
                const searchCriteria: any = req.body.searchCriteria;
                const formattedFields = String(fields || '').split(',');
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const cursor = req.query.cursor;
                const pageSize = parseInt(String(req.query.pageSize));

                logInfo('Revert::SEARCH EVENT', connection.app?.env?.accountId, tenantId, searchCriteria, fields);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        let events: any = await axios({
                            method: 'post',
                            url: `https://api.hubapi.com/crm/v3/objects/meetings/search`,
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify({
                                ...searchCriteria,
                                limit: pageSize || 100,
                                after: cursor || 0,
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
                        const nextCursor = events.data?.paging?.next?.after || undefined;

                        events = events.data.results as any[];
                        events = await Promise.all(
                            events?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedEvent>({
                                        obj: { ...l, ...l?.properties },
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: undefined, results: events });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        const pagingString = `${pageSize ? `&per_page=${pageSize}` : ''}${
                            cursor ? `&page_token=${cursor}` : ''
                        }`;
                        let events: any = await axios({
                            method: 'get',
                            url: `https://www.zohoapis.com/crm/v3/Events/search?criteria=${searchCriteria}${pagingString}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                        });
                        const nextCursor = events.data?.info?.next_page_token || undefined;
                        const prevCursor = events.data?.info?.previous_page_token || undefined;
                        events = events.data.data;
                        events = await Promise.all(
                            events?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedEvent>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: events });
                        break;
                    }
                    case TP_ID.sfdc: {
                        const instanceUrl = connection.tp_account_url;
                        let events: any = await axios({
                            method: 'get',
                            url: `${instanceUrl}/services/data/v56.0/search?q=${searchCriteria}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        events = events?.data?.searchRecords;
                        events = await Promise.all(
                            events?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedEvent>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', results: events });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        throw new NotFoundError({ error: 'Method not allowed' });
                    }
                    case TP_ID.ms_dynamics_365_sales: {
                        let searchString = fields ? `$select=${fields}` : '';
                        if (searchCriteria) {
                            searchString += fields ? `&$filter=${searchCriteria}` : `$filter=${searchCriteria}`;
                        }
                        const pagingString = cursor ? encodeURI(cursor).split('?')[1] : '';
                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/api/data/v9.2/appointments?${searchString}${pagingString}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                Accept: 'application/json',
                                Prefer: pageSize ? `odata.maxpagesize=${pageSize}` : '',
                            },
                        });

                        const unifiedEvents = await Promise.all(
                            result.data.value.map(
                                async (contact: any) =>
                                    await unifyObject<any, UnifiedEvent>({
                                        obj: contact,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );

                        res.send({
                            status: 'ok',
                            next: result.data['@odata.nextLink'],
                            previous: undefined,
                            results: unifiedEvents,
                        });
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
        async deleteEvent(req, res) {
            try {
                const connection = res.locals.connection;
                const eventId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo(
                    'Revert::DELETE EVENT',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    eventId
                );

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        await axios({
                            method: 'delete',
                            url: `https://api.hubapi.com/crm/v3/objects/meetings/${eventId}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        res.send({ status: 'ok', message: 'deleted' });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        await axios({
                            method: 'delete',
                            url: `https://www.zohoapis.com/crm/v3/Events/${eventId}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                        });
                        res.send({ status: 'ok', message: 'deleted' });
                        break;
                    }
                    case TP_ID.sfdc: {
                        const instanceUrl = connection.tp_account_url;
                        await axios({
                            method: 'delete',
                            url: `${instanceUrl}/services/data/v56.0/sobjects/Event/${eventId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        res.send({ status: 'ok', message: 'deleted' });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        await axios.delete<{ data: Partial<PipedriveEvent> } & PipedrivePagination>(
                            `${connection.tp_account_url}/v1/activities/${eventId}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        res.send({ status: 'ok', message: 'deleted' });
                        break;
                    }
                    case TP_ID.closecrm: {
                        await axios({
                            method: 'delete',
                            url: `https://api.close.com/api/v1/activity/meeting/${eventId}/`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });

                        res.send({ status: 'ok', message: 'deleted' });
                        break;
                    }
                    case TP_ID.ms_dynamics_365_sales: {
                        await axios({
                            method: 'delete',
                            url: `${connection.tp_account_url}/api/data/v9.2/appointments(${eventId})`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                Accept: 'application/json',
                            },
                        });
                        res.send({ status: 'ok', message: 'deleted' });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not delete event', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { eventService };
