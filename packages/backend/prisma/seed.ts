import { randomUUID } from 'crypto';
import { PrismaClient, OBJECT_TYPES, TP_ID, fieldMappings } from '@prisma/client';
import { rootSchemaMappingId } from '../constants/common';
// import { PrismaClient, TP_ID, ENV, OBJECT_TYPES } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // const localAccount = await prisma.accounts.upsert({
    //     where: { id: 'localAccount' },
    //     update: {},
    //     create: {
    //         id: 'localAccount',
    //         private_token: 'localPrivateToken',
    //         public_token: 'localPublicToken',
    //         tenant_count: 0,
    //         environments: {
    //             createMany: {
    //                 data: [
    //                     {
    //                         id: 'localEnv',
    //                         env: ENV.development,
    //                         private_token: 'localPrivateToken',
    //                         public_token: 'localPublicToken',
    //                     },
    //                 ],
    //             },
    //         },
    //     },
    // });
    // await Promise.all(
    //     Object.keys(TP_ID).map(async (tp) => {
    //         const localRevertApp = await prisma.apps.create({
    //             data: {
    //                 id: `${tp}_${localAccount.id}`,
    //                 tp_id: tp as TP_ID,
    //                 scope: [],
    //                 owner_account_public_token: localAccount.public_token,
    //                 is_revert_app: true,
    //                 environmentId: 'localEnv',
    //             },
    //         });
    //         console.log({ localAccount, localRevertApp });
    //     })
    // );

    // root schema mapping for note starts --------------------------------------------------
    const allFields = {
        [OBJECT_TYPES.note]: [
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'hs_note_body',
                    [TP_ID.pipedrive]: 'content',
                    [TP_ID.sfdc]: 'Body',
                    [TP_ID.zohocrm]: 'Note_Content',
                },
                target_field_name: 'content',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'id',
                    [TP_ID.pipedrive]: 'id',
                    [TP_ID.sfdc]: 'Id',
                    [TP_ID.zohocrm]: 'id',
                },
                target_field_name: 'id',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'id',
                    [TP_ID.pipedrive]: 'id',
                    [TP_ID.sfdc]: 'Id',
                    [TP_ID.zohocrm]: 'id',
                },
                target_field_name: 'remoteId',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'hs_createdate',
                    [TP_ID.pipedrive]: 'add_time',
                    [TP_ID.sfdc]: 'CreatedDate',
                    [TP_ID.zohocrm]: 'Created_Time',
                },
                target_field_name: 'createdTimestamp',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'hs_lastmodifieddate',
                    [TP_ID.pipedrive]: 'update_time',
                    [TP_ID.sfdc]: 'LastModifiedDate',
                    [TP_ID.zohocrm]: 'Modified_Time',
                },
                target_field_name: 'updatedTimestamp',
            },
        ],
    };
    const allSchemas = Object.keys(allFields).map(obj => {
        return {
            id: randomUUID(),
            fields: allFields[obj as keyof typeof allFields].map((n) => n.target_field_name),
            object: obj as OBJECT_TYPES,
        }
    }) 
    await prisma.schema_mapping.create({
        data: {
            id: rootSchemaMappingId,
            object_schemas: {
                createMany: {
                    data: allSchemas,
                },
            },
            object_schema_ids: allSchemas.map(s => s.id)
        },
    });

    const fieldMappingForAll: fieldMappings[] = [];
        Object.values(OBJECT_TYPES).forEach(obj => {
            Object.values(TP_ID).forEach(async (tpId) => {
                const objSchema = allSchemas.find(s => s.object === obj);
                const fieldMappings = objSchema?.fields.map((field) => ({
                    id: randomUUID(),
                    source_tp_id: tpId,
                    schema_id: objSchema.id,
                    source_field_name: allFields[obj as "note"].find(a => a.target_field_name === field)?.source_field_name[tpId]!,
                    target_field_name: field,
                    is_standard_field: true,
                }));
                if (fieldMappings) {
                    fieldMappingForAll.push(...fieldMappings);
                }
            })

        }) 
    await prisma.fieldMappings.createMany({
        data: fieldMappingForAll,
    });
    // root schema mapping for note ends --------------------------------------------------
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
