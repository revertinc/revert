import revertTenantMiddleware from '../../../helpers/tenantIdMiddleware';
import ContactS from '../../../services/contact';
import logError from '../../../helpers/logError';
import revertAuthMiddleware from '../../../helpers/authMiddleware';
import { ContactService } from '../../../generated/typescript/api/resources/crm/resources/contact/service/ContactService';
import { InternalServerError } from '../../../generated/typescript/api/resources/common';
import { UnifiedContact } from '../../../models/unified';

const contactService = new ContactService(
    {
        async getUnifiedContact(req, res) {
            try {
                const result = await ContactS.getUnifiedContact({
                    connection: res.locals.connection,
                    contactId: req.params.id,
                    fields: req.query.fields,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch lead', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getUnifiedContacts(req, res) {
            try {
                const result = await ContactS.getUnifiedContacts({
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
        async createContact(req, res) {
            try {
                const result = await ContactS.createContact({
                    contactData: req.body as UnifiedContact,
                    connection: res.locals.connection,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not create lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateContact(req, res) {
            try {
                const result = await ContactS.updateContact({
                    connection: res.locals.connection,
                    contactData: req.body as UnifiedContact,
                    contactId: req.params.id,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not update lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async searchContacts(req, res) {
            try {
                const result = await ContactS.searchUnifiedContacts({
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

export { contactService };