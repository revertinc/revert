import revertTenantMiddleware from '../../../helpers/tenantIdMiddleware';
import revertAuthMiddleware from '../../../helpers/authMiddleware';
import UserS from '../../../services/user';
import logError from '../../../helpers/logError';
import { UserService } from '../../../generated/typescript/api/resources/crm/resources/user/service/UserService';
import { InternalServerError } from '../../../generated/typescript/api/resources/common';
import { UnifiedUser } from '../../../models/unified/user';

const userService = new UserService(
    {
        async getUnifiedUser(req, res) {
            try {
                const result = await UserS.getUnifiedUser({
                    connection: res.locals.connection,
                    userId: req.params.id,
                    fields: req.query.fields,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch lead', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getUnifiedUsers(req, res) {
            try {
                const result = await UserS.getUnifiedUsers({
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
        async createUser(req, res) {
            try {
                const result = await UserS.createUser({
                    userData: req.body as UnifiedUser,
                    connection: res.locals.connection,
                });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not create lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export {userService};
