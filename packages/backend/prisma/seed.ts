import { randomUUID } from 'crypto';
import { ENV, PrismaClient, TP_ID, fieldMappings } from '@prisma/client';
import { ChatStandardObjects, StandardObjects, rootSchemaMappingId } from '../constants/common';
import { allFields, chatFields } from './fields';
const prisma = new PrismaClient();

async function main() {
    const localAccount = await prisma.accounts.upsert({
        where: { id: 'localAccount' },
        update: {},
        create: {
            id: 'localAccount',
            private_token: 'localPrivateToken',
            public_token: 'localPublicToken',
            tenant_count: 0,
            environments: {
                createMany: {
                    data: [
                        {
                            id: 'localEnv',
                            env: ENV.development,
                            private_token: 'localPrivateToken',
                            public_token: 'localPublicToken',
                        },
                    ],
                },
            },
        },
    });
    await Promise.all(
        Object.keys(TP_ID).map(async (tp) => {
            const localRevertApp = await prisma.apps.upsert({
                where: {
                    id: `${tp}_${localAccount.id}`,
                },
                update: {},
                create: {
                    id: `${tp}_${localAccount.id}`,
                    tp_id: tp as TP_ID,
                    scope: [],
                    owner_account_public_token: localAccount.public_token,
                    is_revert_app: true,
                    environmentId: 'localEnv',
                },
            });
            console.log({ localAccount, localRevertApp });
        })
    );

    let allSchemas: any = Object.keys(allFields).map((obj) => {
        return {
            id: randomUUID(),
            fields: allFields[obj as keyof typeof allFields].map((n) => n.target_field_name),
            object: obj as StandardObjects,
        };
    });

    const chatSchemas = Object.keys(chatFields).map((obj) => {
        return {
            id: randomUUID(),
            fields: chatFields[obj as keyof typeof chatFields].map((n) => n.target_field_name),
            object: obj as ChatStandardObjects,
        };
    });

    const mergedSchema = [...allSchemas, ...chatSchemas];

    await prisma.schema_mapping.deleteMany({
        where: {
            id: rootSchemaMappingId,
        },
    });

    // Ensures that for the updated or newly generated schemas, their IDs are associated with rootSchemaMappingId in schema_mapping -> object_schema_ids.
    await prisma.schema_mapping.upsert({
        where: {
            id: rootSchemaMappingId,
        },
        update: {
            object_schemas: {
                createMany: {
                    data: mergedSchema,
                },
            },
            object_schema_ids: mergedSchema.map((s) => s.id),
        },
        create: {
            id: rootSchemaMappingId,
            object_schemas: {
                createMany: {
                    data: mergedSchema,
                },
            },
            object_schema_ids: mergedSchema.map((s) => s.id),
        },
    });

    const fieldMappingForAll: fieldMappings[] = [];
    Object.values(StandardObjects).forEach((obj) => {
        Object.values(TP_ID).forEach(async (tpId) => {
            if (
                !(
                    tpId === 'hubspot' ||
                    tpId === 'zohocrm' ||
                    tpId === 'sfdc' ||
                    tpId === 'pipedrive' ||
                    tpId === 'closecrm'
                )
            )
                return;
            const objSchema = allSchemas.find((s: any) => s.object === obj);
            const fieldMappings = objSchema?.fields.map((field: any) => ({
                id: randomUUID(),
                source_tp_id: tpId,
                schema_id: objSchema.id,
                source_field_name: allFields[obj as 'note' | 'contact'].find((a) => a.target_field_name === field)
                    ?.source_field_name[tpId]!,
                target_field_name: field,
                is_standard_field: true,
            }));
            if (fieldMappings) {
                fieldMappingForAll.push(...fieldMappings);
            }
        });
    });

    Object.values(ChatStandardObjects).forEach((obj) => {
        Object.values(TP_ID).forEach(async (tpId) => {
            if (!(tpId === 'slack' || tpId === 'discord')) return;
            const objSchema = chatSchemas.find((s: any) => s.object === obj);
            const fieldMappings = objSchema?.fields.map((field: any) => ({
                id: randomUUID(),
                source_tp_id: tpId,
                schema_id: objSchema.id,
                source_field_name: chatFields[obj].find((a) => a.target_field_name === field)?.source_field_name[tpId]!,
                target_field_name: field,
                is_standard_field: true,
            }));
            if (fieldMappings) {
                fieldMappingForAll.push(...fieldMappings);
            }
        });
    });

    await prisma.fieldMappings.createMany({
        data: fieldMappingForAll,
    });
}
main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
