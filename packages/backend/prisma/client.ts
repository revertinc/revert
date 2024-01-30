import { PrismaClient, Prisma, TP_ID } from '@prisma/client';
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
    query: {
        connections: {
            async upsert({ args, query }) {
                if (args.create?.tp_customer_id) {
                    args.create.tp_customer_id = gcm.encrypt(args.create.tp_customer_id, config.AES_ENCRYPTION_SECRET);
                }

                // prepend environment Id to the t_id. connectionId = environmentId_t_id
                if (args.where?.id && args.create?.environmentId) {
                    const newConnectionId = `${args.create.environmentId}_${args.create.tp_id}_${args.where.id}`;
                    args.where.id = newConnectionId;
                    args.create.id = newConnectionId;
                }

                if (args.update?.tp_id !== TP_ID.discord) {
                    args.update.app_bot_token = null;
                }

                // tp_account_url: zohocrm sfdc pipedrive jira
                if (args.update?.tp_id) {
                    const tpId = args.update.tp_id;
                    if (
                        !(
                            tpId === TP_ID.zohocrm ||
                            tpId === TP_ID.sfdc ||
                            tpId === TP_ID.pipedrive ||
                            tpId === TP_ID.jira
                        )
                    ) {
                        args.update.tp_account_url = null;
                    }
                }

                if (args.update?.tp_customer_id) {
                    // when same t_id is used to update with other app
                    const thirdPartyCustomerId: any = args.update.tp_customer_id;
                    args.update.tp_customer_id = gcm.encrypt(thirdPartyCustomerId, config.AES_ENCRYPTION_SECRET);
                }

                return query(args);
            },
        },
    },
});

export default prisma;
export { Prisma, xprisma };
