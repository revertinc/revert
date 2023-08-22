import { PrismaClient, Prisma } from '@prisma/client';
import config from '../config';
import gcm from '../helpers/gcmUtil';

const prisma = new PrismaClient();

// Prisma middleware to encrypt and decrypt data on fly
prisma.$use(async (params, next) => {
    if (params.model !== 'connections') {
        return next(params);
    }

    const isReadOperation = ['findFirst', 'findMany', 'delete'].includes(params.action);
    const isWriteOperation = ['update', 'upsert'].includes(params.action);

    if (isReadOperation) {
        return handleReadOperation(params, next);
    } else if (isWriteOperation) {
        return handleWriteOperation(params, next);
    }
    return next(params);
});

async function handleReadOperation(
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<any>
): Promise<any> {
    try {
        const connections = await next(params);
        if (!connections) return connections;
        if (Array.isArray(connections)) {
            connections.forEach((connection) => {
                connection.tp_customer_id = gcm.decrypt(connection.tp_customer_id, config.AES_ENCRYPTION_SECRET);
            });
        } else {
            connections.tp_customer_id = gcm.decrypt(connections.tp_customer_id, config.AES_ENCRYPTION_SECRET);
        }
        return connections;
    } catch (error: any) {
        throw new Error(error);
    }
}

async function handleWriteOperation(
    params: Prisma.MiddlewareParams,
    _: (params: Prisma.MiddlewareParams) => Promise<any>
): Promise<any> {
    try {
        if (Array.isArray(params.args?.data)) {
            params.args?.data.forEach((connection: any) => {
                connection.tp_customer_id = gcm.encrypt(connection.tp_customer_id, config.AES_ENCRYPTION_SECRET);
            });
        } else {
            if (params.action === 'upsert') {
                params.args.create.tp_customer_id = gcm.encrypt(
                    params.args.create.tp_customer_id,
                    config.AES_ENCRYPTION_SECRET
                );
            } else {
                params.args.data.tp_customer_id = gcm.encrypt(
                    params.args.data.tp_customer_id,
                    config.AES_ENCRYPTION_SECRET
                );
            }
        }
    } catch (error: any) {
        throw new Error(error);
    }
}

export default prisma;
export { Prisma };
