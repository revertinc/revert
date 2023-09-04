import { randomUUID } from 'crypto';
import { PrismaClient, TP_ID, fieldMappings } from '@prisma/client';
import { StandardObjects, rootSchemaMappingId } from '../constants/common';
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
    // TODO: map additional fields (check mapping in models for disunify)
    const allFields = {
        [StandardObjects.note]: [
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
        [StandardObjects.contact]: [
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'firstname',
                    [TP_ID.pipedrive]: 'first_name',
                    [TP_ID.sfdc]: 'FirstName',
                    [TP_ID.zohocrm]: 'First_Name',
                },
                target_field_name: 'firstName',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'lastname',
                    [TP_ID.pipedrive]: 'last_name',
                    [TP_ID.sfdc]: 'LastName',
                    [TP_ID.zohocrm]: 'Last_Name',
                },
                target_field_name: 'lastName',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'phone',
                    [TP_ID.pipedrive]: 'phone.0.value',
                    [TP_ID.sfdc]: 'Phone',
                    [TP_ID.zohocrm]: 'Phone',
                },
                target_field_name: 'phone',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'email',
                    [TP_ID.pipedrive]: 'primary_email',
                    [TP_ID.sfdc]: 'Email',
                    [TP_ID.zohocrm]: 'Email',
                },
                target_field_name: 'email',
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
        [StandardObjects.company]: [
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'name',
                    [TP_ID.pipedrive]: 'name',
                    [TP_ID.sfdc]: 'Name',
                    [TP_ID.zohocrm]: 'Account_Name',
                },
                target_field_name: 'name',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'industry',
                    [TP_ID.pipedrive]: undefined,
                    [TP_ID.sfdc]: 'Industry',
                    [TP_ID.zohocrm]: 'Industry',
                },
                target_field_name: 'industry',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'description',
                    [TP_ID.pipedrive]: undefined,
                    [TP_ID.sfdc]: 'Description',
                    [TP_ID.zohocrm]: 'Description',
                },
                target_field_name: 'description',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'annualrevenue',
                    [TP_ID.pipedrive]: undefined,
                    [TP_ID.sfdc]: 'AnnualRevenue',
                    [TP_ID.zohocrm]: 'Annual_Revenue',
                },
                target_field_name: 'annualRevenue',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'numberofemployees',
                    [TP_ID.pipedrive]: 'people_count',
                    [TP_ID.sfdc]: 'NumberOfEmployees',
                    [TP_ID.zohocrm]: 'Employees',
                },
                target_field_name: 'size',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'phone',
                    [TP_ID.pipedrive]: undefined,
                    [TP_ID.sfdc]: 'Phone',
                    [TP_ID.zohocrm]: 'Phone',
                },
                target_field_name: 'phone',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: undefined,
                    [TP_ID.pipedrive]: 'address_street_number',
                    [TP_ID.sfdc]: 'BillingStreet',
                    [TP_ID.zohocrm]: 'Billing_Street',
                },
                target_field_name: 'address.street',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'city',
                    [TP_ID.pipedrive]: 'address_locality',
                    [TP_ID.sfdc]: 'BillingCity',
                    [TP_ID.zohocrm]: 'Billing_City',
                },
                target_field_name: 'address.city',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'state',
                    [TP_ID.pipedrive]: undefined,
                    [TP_ID.sfdc]: 'BillingState',
                    [TP_ID.zohocrm]: 'Billing_State',
                },
                target_field_name: 'address.state',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'country',
                    [TP_ID.pipedrive]: 'address_country',
                    [TP_ID.sfdc]: 'BillingCountry',
                    [TP_ID.zohocrm]: 'Billing_Country',
                },
                target_field_name: 'address.country',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'zip',
                    [TP_ID.pipedrive]: 'address_postal_code',
                    [TP_ID.sfdc]: 'BillingPostalCode',
                    [TP_ID.zohocrm]: 'Billing_Code',
                },
                target_field_name: 'address.zip',
            },
            {
                source_field_name: {
                    [TP_ID.hubspot]: 'zip',
                    [TP_ID.pipedrive]: 'address_postal_code',
                    [TP_ID.sfdc]: 'BillingPostalCode',
                    [TP_ID.zohocrm]: 'Billing_Code',
                },
                target_field_name: 'address.postalCode',
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
            object: obj as StandardObjects,
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
        Object.values(StandardObjects).forEach(obj => {
            Object.values(TP_ID).forEach(async (tpId) => {
                const objSchema = allSchemas.find(s => s.object === obj);
                const fieldMappings = objSchema?.fields.map((field) => ({
                    id: randomUUID(),
                    source_tp_id: tpId,
                    schema_id: objSchema.id,
                    source_field_name: allFields[obj as "note" | "contact"].find(a => a.target_field_name === field)?.source_field_name[tpId]!,
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
