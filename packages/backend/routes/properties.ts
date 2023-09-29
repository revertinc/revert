import { InternalServerError } from '../generated/typescript/api/resources/common';
import { PropertiesService } from '../generated/typescript/api/resources/properties/service/PropertiesService';
import { getObjectPropertiesForConnection } from '../services/crm/properties';
import revertAuthMiddleware from '../helpers/authMiddleware';
import { isStandardError } from '../helpers/error';
import { logError } from '../helpers/logger';
import revertTenantMiddleware from '../helpers/tenantIdMiddleware';

const propertiesService = new PropertiesService(
    {
        async getObjectProperties(req, res) {
            const { connection } = res.locals;
            const objectName = req.params.objectName;

            try {
                const result = await getObjectPropertiesForConnection({ objectName, connection });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch properties', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { propertiesService };
