import revertTenantMiddleware from '../../../helpers/tenantIdMiddleware';
import EventS from '../../../services/event';
import logError from '../../../helpers/logError';
import { EventService } from '../../../generated/typescript/api/resources/crm/resources/event/service/EventService';
import revertAuthMiddleware from '../../../helpers/authMiddleware';
import { InternalServerError } from '../../../generated/typescript/api/resources/common';
import { UnifiedEvent } from '../../../models/unified';

const eventService = new EventService(
    {
        async getUnifiedEvent(req, res) {
            try {
                const result = await EventS.getUnifiedEvent({
                    connection: res.locals.connection,
                    eventId: req.params.id,
                    fields: req.query.fields,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch lead', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getUnifiedEvents(req, res) {
            try {
                const result = await EventS.getUnifiedEvents({
                    connection: res.locals.connection,
                    fields: req.query.fields,
                    pageSize: parseInt(String(req.query.pageSize)),
                    cursor: req.query.cursor,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch leads', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createEvent(req, res) {
            try {
                const result = await EventS.createEvent({
                    eventData: req.body as UnifiedEvent,
                    connection: res.locals.connection,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not create lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateEvent(req, res) {
            try {
                const result = await EventS.updateEvent({
                    connection: res.locals.connection,
                    eventData: req.body as UnifiedEvent,
                    eventId: req.params.id,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not update lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async searchEvents(req, res) {
            try {
                const result = await EventS.searchUnifiedEvents({
                    connection: res.locals.connection,
                    fields: req.query.fields,
                    searchCriteria: req.body.searchCriteria,
                });
                res.send(result);
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
