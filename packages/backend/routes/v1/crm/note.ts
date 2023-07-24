import NoteS from '../../../services/note';
import logError from '../../../helpers/logError';
import { NoteService } from '../../../generated/typescript/api/resources/crm/resources/note/service/NoteService';
import revertAuthMiddleware from '../../../helpers/authMiddleware';
import revertTenantMiddleware from '../../../helpers/tenantIdMiddleware';
import { InternalServerError } from '../../../generated/typescript/api/resources/common';
import { UnifiedNote } from '../../../models/unified';

const noteService = new NoteService(
    {
        async getUnifiedNote(req, res) {
            try {
                const result = await NoteS.getUnifiedNote({
                    connection: res.locals.connection,
                    noteId: req.params.id,
                    fields: req.query.fields,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch lead', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getUnifiedNotes(req, res) {
            try {
                const result = await NoteS.getUnifiedNotes({
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
        async createNote(req, res) {
            try {
                const result = await NoteS.createNote({
                    noteData: req.body as UnifiedNote,
                    connection: res.locals.connection,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not create lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateNote(req, res) {
            try {
                const result = await NoteS.updateNote({
                    connection: res.locals.connection,
                    noteData: req.body as UnifiedNote,
                    noteId: req.params.id,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not update lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async searchNotes(req, res) {
            try {
                const result = await NoteS.searchUnifiedNotes({
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

export { noteService };
