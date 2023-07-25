import revertTenantMiddleware from '../../../helpers/tenantIdMiddleware';
import revertAuthMiddleware from '../../../helpers/authMiddleware';
import TaskS from '../../../services/task';
import logError from '../../../helpers/logError';
import { TaskService } from '../../../generated/typescript/api/resources/crm/resources/task/service/TaskService';
import { InternalServerError } from '../../../generated/typescript/api/resources/common';
import { UnifiedTask } from '../../../models/unified';

const taskService = new TaskService(
    {
        async getUnifiedTask(req, res) {
            try {
                const result = await TaskS.getUnifiedTask({
                    connection: res.locals.connection,
                    taskId: req.params.id,
                    fields: req.query.fields,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch lead', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getUnifiedTasks(req, res) {
            try {
                const result = await TaskS.getUnifiedTasks({
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
        async createTask(req, res) {
            try {
                const result = await TaskS.createTask({
                    taskData: req.body as UnifiedTask,
                    connection: res.locals.connection,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not create lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateTask(req, res) {
            try {
                const result = await TaskS.updateTask({
                    connection: res.locals.connection,
                    taskData: req.body as UnifiedTask,
                    taskId: req.params.id,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not update lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async searchTasks(req, res) {
            try {
                const result = await TaskS.searchUnifiedTasks({
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

export { taskService };
