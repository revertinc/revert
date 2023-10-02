import { InternalServerError } from '../generated/typescript/api/resources/common';
import { getObjectPropertiesForConnection, setObjectPropertiesForConnection } from '../services/crm/properties';
import revertAuthMiddleware from '../helpers/authMiddleware';
import { isStandardError } from '../helpers/error';
import { logError } from '../helpers/logger';
import revertTenantMiddleware from '../helpers/tenantIdMiddleware';
import { PropertiesService } from '../generated/typescript/api/resources/crm/resources/properties/service/PropertiesService';

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
        async setCustomProperties(req, res) {
            const { connection } = res.locals;
            const objectName = req.params.objectName;
            const objectProperties = req.body;
            try {
                const result = await setObjectPropertiesForConnection({ objectName, objectProperties, connection });
                res.send(result);
            } catch (error: any) {
                logError(error);
                console.error('Could not create properties', error);
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
