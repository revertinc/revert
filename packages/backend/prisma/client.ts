import { PrismaClient, Prisma } from '@prisma/client';
import config from '../config';
import gcm from '../helpers/gcmUtil';

const prisma = new PrismaClient();

const xprisma = prisma.$extends({
    name: 'ExtendedEncryptedConnection',
    result: {
        connections: {
            tp_customer_id: {
                needs: { tp_customer_id: true },
                compute(connection) {
                    return gcm.decrypt(connection.tp_customer_id, config.AES_ENCRYPTION_SECRET);
                },
            },
        },
    },
});

export default prisma;
export { Prisma, xprisma };
