import logError from '../../../helpers/logError';
import revertTenantMiddleware from '../../../helpers/tenantIdMiddleware';
import revertAuthMiddleware from '../../../helpers/authMiddleware';
import LeadS from '../../../services/lead';
import { LeadService } from '../../../generated/typescript/api/resources/crm/resources/lead/service/LeadService';
import { InternalServerError } from '../../../generated/typescript/api/resources/common';
import { UnifiedLead } from '../../../models/unified';

const leadService = new LeadService(
    {
        async getUnifiedLead(req, res) {
            try {
                const result = await LeadS.getUnifiedLead({
                    connection: res.locals.connection,
                    leadId: req.params.id,
                    fields: req.query.fields,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch lead', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getUnifiedLeads(req, res) {
            try {
                const result = await LeadS.getUnifiedLeads({
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
        async createLead(req, res) {
            try {
                const result = await LeadS.createLead({
                    leadData: req.body as UnifiedLead,
                    connection: res.locals.connection,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not create lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateLead(req, res) {
            try {
                const result = await LeadS.updateLead({
                    connection: res.locals.connection,
                    leadData: req.body as UnifiedLead,
                    leadId: req.params.id,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not update lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async searchLeads(req, res) {
            try {
                const result = await LeadS.searchUnifiedLeads({
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

export { leadService };
