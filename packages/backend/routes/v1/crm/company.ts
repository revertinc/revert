import revertTenantMiddleware from '../../../helpers/tenantIdMiddleware';
import revertAuthMiddleware from '../../../helpers/authMiddleware';
import CompanyS from '../../../services/company';
import logError from '../../../helpers/logError';
import { CompanyService } from '../../../generated/typescript/api/resources/crm/resources/company/service/CompanyService';
import { InternalServerError } from '../../../generated/typescript/api/resources/common';
import { UnifiedCompany } from '../../../models/unified';

const companyService = new CompanyService(
    {
        async getUnifiedCompany(req, res) {
            try {
                const result = await CompanyS.getUnifiedCompany({
                    connection: res.locals.connection,
                    companyId: req.params.id,
                    fields: req.query.fields,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch lead', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getUnifiedCompanies(req, res) {
            try {
                const result = await CompanyS.getUnifiedCompanies({
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
        async createCompany(req, res) {
            try {
                const result = await CompanyS.createCompany({
                    companyData: req.body as UnifiedCompany,
                    connection: res.locals.connection,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not create lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateCompany(req, res) {
            try {
                const result = await CompanyS.updateCompany({
                    connection: res.locals.connection,
                    companyData: req.body as UnifiedCompany,
                    companyId: req.params.id,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not update lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async searchCompanies(req, res) {
            try {
                const result = await CompanyS.searchUnifiedCompanies({
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

export { companyService };
