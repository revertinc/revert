import logError from '../../../helpers/logError';
import revertTenantMiddleware from '../../../helpers/tenantIdMiddleware';
import revertAuthMiddleware from '../../../helpers/authMiddleware';
import DealS from '../../../services/deal';
import { DealService } from '../../../generated/typescript/api/resources/crm/resources/deal/service/DealService';
import { InternalServerError } from '../../../generated/typescript/api/resources/common';
import { UnifiedDeal } from '../../../models/unified';

const dealService = new DealService(
    {
        async getUnifiedDeal(req, res) {
            try {
                const result = await DealS.getUnifiedDeal({
                    connection: res.locals.connection,
                    dealId: req.params.id,
                    fields: req.query.fields,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch deal', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getUnifiedDeals(req, res) {
            try {
                const result = await DealS.getUnifiedDeals({
                    connection: res.locals.connection,
                    fields: req.query.fields,
                    pageSize: parseInt(String(req.query.pageSize)),
                    cursor: req.query.cursor,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch deals', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createDeal(req, res) {
            try {
                const result = await DealS.createDeal({
                    dealData: req.body as UnifiedDeal,
                    connection: res.locals.connection,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not create deal', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateDeal(req, res) {
            try {
                const result = await DealS.updateDeal({
                    connection: res.locals.connection,
                    dealData: req.body as UnifiedDeal,
                    dealId: req.params.id,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not update deal', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async searchDeals(req, res) {
            try {
                const result = await DealS.searchUnifiedDeals({
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

export { dealService };
