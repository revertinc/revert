import { randomUUID } from 'crypto';
import { ENV, PrismaClient, TP_ID, fieldMappings } from '@prisma/client';
import { ChatStandardObjects, StandardObjects, TicketStandardObjects, rootSchemaMappingId } from '../constants/common';
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

    const ticketingFields = {
        [TicketStandardObjects.ticketTask]: [
            {
                source_field_name: {
                    [TP_ID.linear]: 'id',
                    [TP_ID.clickup]: 'id',
                },
                target_field_name: 'id',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'id',
                    [TP_ID.clickup]: 'id',
                },
                target_field_name: 'remoteId',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'title',
                    [TP_ID.clickup]: 'name',
                },
                target_field_name: 'name',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'assignee',
                    [TP_ID.clickup]: 'assignees',
                },
                target_field_name: 'assignees',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'description',
                    [TP_ID.clickup]: 'description',
                },
                target_field_name: 'description',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'state',
                    [TP_ID.clickup]: 'status',
                },
                target_field_name: 'status',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'priorityLabel',
                    [TP_ID.clickup]: 'priority',
                },
                target_field_name: 'priority',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'creator.id',
                    [TP_ID.clickup]: 'creator.id',
                },
                target_field_name: 'creatorId',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'createdAt',
                    [TP_ID.clickup]: 'date_created',
                },
                target_field_name: 'createdTimeStamp',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'updatedAt',
                    [TP_ID.clickup]: 'date_updated',
                },
                target_field_name: 'updatedTimeStamp',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'dueDate',
                    [TP_ID.clickup]: 'due_date',
                },
                target_field_name: 'dueDate',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'completedDate',
                    [TP_ID.clickup]: 'date_done',
                },
                target_field_name: 'completedDate',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'parent.id',
                    [TP_ID.clickup]: 'parent',
                },
                target_field_name: 'parentId',
            },
        ],
        [TicketStandardObjects.ticketUser]: [
            {
                source_field_name: {
                    [TP_ID.linear]: 'id',
                    [TP_ID.clickup]: undefined,
                },
                target_field_name: 'id',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'id',
                    [TP_ID.clickup]: undefined,
                },
                target_field_name: 'remoteId',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'email',
                    [TP_ID.clickup]: undefined,
                },
                target_field_name: 'email',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'name',
                    [TP_ID.clickup]: undefined,
                },
                target_field_name: 'name',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'active',
                    [TP_ID.clickup]: undefined,
                },
                target_field_name: 'isActive',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'avatarUrl',
                    [TP_ID.clickup]: undefined,
                },
                target_field_name: 'avatar',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'createdAt',
                    [TP_ID.clickup]: undefined,
                },
                target_field_name: 'createdTimeStamp',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: null,
                    [TP_ID.clickup]: undefined,
                },
                target_field_name: 'updatedTimeStamp',
            },
            {
                source_field_name: {
                    [TP_ID.linear]: 'admin',
                    [TP_ID.clickup]: undefined,
                },
                target_field_name: 'isAdmin',
            },
        ],
    };

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

    const ticketSchemas = Object.keys(ticketingFields).map((obj) => {
        return {
            id: randomUUID(),
            fields: ticketingFields[obj as keyof typeof ticketingFields].map((n) => n.target_field_name),
            object: obj as TicketStandardObjects,
        };
    });

    const mergedSchema = [...allSchemas, ...chatSchemas, ...ticketSchemas];
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

    Object.values(TicketStandardObjects).forEach((obj) => {
        Object.values(TP_ID).forEach(async (tpId) => {
            if (!(tpId === 'linear' || tpId === 'clickup')) return;
            const objSchema = ticketSchemas.find((s: any) => s.object === obj);
            const fieldMappings = objSchema?.fields.map((field: any) => {
                const sourceFields: any = (ticketingFields[obj] as { target_field_name: string }[]).find(
                    (a) => a.target_field_name === field
                );
                return {
                    id: randomUUID(),
                    source_tp_id: tpId,
                    schema_id: objSchema.id,
                    source_field_name: sourceFields?.source_field_name[tpId]!,
                    target_field_name: field,
                    is_standard_field: true,
                };
            });
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
