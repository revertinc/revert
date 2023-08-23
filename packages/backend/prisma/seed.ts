import { randomUUID } from 'crypto';
import { PrismaClient, OBJECT_TYPES, TP_ID } from '@prisma/client';
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
    const noteFields = [
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_note_body',
                [TP_ID.pipedrive]: 'content',
                [TP_ID.sfdc]: 'Body',
                [TP_ID.zohocrm]: 'Note_Content',
            },
            target_field_name: 'content',
        },
    ];
    const rootSchema = await prisma.schemas.create({
        data: {
            id: randomUUID(),
            object: OBJECT_TYPES.note,
            fields: noteFields.map((n) => n.target_field_name),
        },
    });
    const schemaMapIds: string[] = [];
    await Promise.all(
        Object.values(TP_ID).map(async (tpId) => {
            const noteFieldMappings = noteFields.map((noteField) => ({
                id: randomUUID(),
                source_tp_id: tpId,
                target_schema_id: rootSchema.id,
                source_field_name: noteField.source_field_name[tpId],
                target_field_name: noteField.target_field_name,
                is_standard_field: true,
            }));
            await prisma.fieldMappings.createMany({
                data: noteFieldMappings,
            });
            schemaMapIds.push(...noteFieldMappings.map((n) => n.id));
        })
    );
    await prisma.schema_mapping.create({
        data: { id: randomUUID(), field_mapping_config_id: schemaMapIds },
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
