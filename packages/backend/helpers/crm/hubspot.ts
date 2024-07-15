import axios from 'axios';
import { AllAssociation } from '../../constants/associations';
import { StandardObjects } from '../../constants/common';
import { unifyObject } from './transform';

export const getHubspotAssociationObj = (key: AllAssociation, associateObj: StandardObjects) => {
    const associationTypeMapping: {
        [x in StandardObjects]: { [y in AllAssociation]: number | undefined };
    } = {
        [StandardObjects.note]: {
            dealId: 214,
            companyId: 190,
            contactId: 202,
            leadId: 202,
            noteId: undefined,
        },
        [StandardObjects.deal]: {
            contactId: 3,
            leadId: 3,
            companyId: 341,
            noteId: 213,
            dealId: undefined,
        },
        [StandardObjects.contact]: {
            companyId: 279,
            dealId: 4,
            noteId: 201,
            leadId: undefined,
            contactId: undefined,
        },
        [StandardObjects.lead]: {
            companyId: 279,
            dealId: 4,
            noteId: 201,
            contactId: undefined,
            leadId: undefined,
        },
        [StandardObjects.company]: {
            contactId: 280,
            leadId: 280,
            dealId: 342,
            noteId: 189,
            companyId: undefined,
        },
        [StandardObjects.event]: {
            contactId: 200,
            leadId: 601,
            dealId: 212,
            noteId: undefined,
            companyId: 188,
        },
        [StandardObjects.task]: {
            contactId: 204,
            leadId: undefined,
            dealId: 216,
            noteId: undefined,
            companyId: 192,
        },
        [StandardObjects.user]: {
            contactId: undefined,
            leadId: undefined,
            dealId: undefined,
            noteId: undefined,
            companyId: undefined,
        },
    };
    const associationTypeId = associationTypeMapping[associateObj][key];
    if (associationTypeId) {
        return {
            associationCategory: 'HUBSPOT_DEFINED',
            associationTypeId,
        };
    }
    return null;
};

export type PluralObjectType = 'notes' | 'deals' | 'contacts' | 'leads' | 'companies' | 'events' | 'tasks' | 'users';
export const getStandardObjects = (obj: PluralObjectType) => {
    const correctStandardObj = {
        notes: StandardObjects.note,
        deals: StandardObjects.deal,
        contacts: StandardObjects.contact,
        leads: StandardObjects.lead,
        companies: StandardObjects.company,
        events: StandardObjects.event,
        tasks: StandardObjects.task,
        users: StandardObjects.user,
    };

    const object = correctStandardObj[obj];
    return object ? object : null;
};

export const getAssociationObjects = async (
    originalAssociations: any,
    thirdPartyToken: any,
    thirdPartyId: any,
    connection: any,
    account: any,
    invalidAssociations: any
) => {
    const associatedData: any = {};

    if (originalAssociations) {
        //looping over multiple associations if any.
        for (const [objectType, associatedDataResult] of Object.entries(originalAssociations)) {
            associatedData[objectType] = [];

            if (associatedDataResult) {
                associatedData[objectType] = [...associatedData[objectType], ...(associatedDataResult as any).results];

                let hasMoreLink = (associatedDataResult as any).paging?.next?.link;

                if (hasMoreLink) {
                    //the data is paginated,thus running a loop to get the whole data.
                    while (hasMoreLink) {
                        const nextPageAssociatedData = await axios({
                            method: 'get',
                            url: hasMoreLink,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                                'Content-Type': 'application/json',
                            },
                        });
                        associatedData[objectType] = [
                            ...associatedData[objectType],
                            ...nextPageAssociatedData.data.results,
                        ];

                        //the following if-else condition can mess up,in my test request via postman ,it gets all remaining in the second request call.i tested with around 400  deals associated to a single company.Writing it still to be on the safer side.
                        if (nextPageAssociatedData.data.paging?.next?.link) {
                            hasMoreLink = nextPageAssociatedData.data.paging?.next.link;
                        } else {
                            hasMoreLink = undefined;
                        }

                        if (nextPageAssociatedData.headers['x-hubspot-ratelimit-secondly-remaining'] === 0) {
                            await new Promise((resolve) => setTimeout(resolve, 1000));
                        }
                    }
                }

                //collecting all ids for batch request.
                const ids = (associatedData[objectType] as any[]).map((item) => item.id);

                if (ids.length > 0) {
                    let index = 0;
                    let fullBatchData: any[] = [];

                    while (index < ids.length) {
                        const batchIds = ids.slice(index, index + 100); //the batch api only takes 100 at a time

                        //bacth request for that object type to get full data for that object.
                        const responseData = await axios({
                            method: 'post',
                            url: `https://api.hubapi.com/crm/v3/objects/${objectType}/batch/read`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                                'content-type': 'application/json',
                            },
                            data: JSON.stringify({
                                inputs: batchIds,
                            }),
                        });
                        index += 100;

                        fullBatchData = [...fullBatchData, ...responseData.data.results];

                        if (responseData.headers['x-hubspot-ratelimit-secondly-remaining'] === 0) {
                            await new Promise((resolve) => setTimeout(resolve, 1000));
                        }
                    }

                    //converting the objectType into the correct objType which is needed for unification.
                    const associatedObjectType = getStandardObjects(objectType as PluralObjectType);

                    associatedData[objectType] =
                        associatedObjectType &&
                        associatedObjectType !== null &&
                        (await Promise.all(
                            fullBatchData.map(
                                async (item: any) =>
                                    await unifyObject<any, any>({
                                        obj: {
                                            ...item,
                                            ...item?.properties,
                                        },
                                        tpId: thirdPartyId,
                                        objType: associatedObjectType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        ));
                }
            }
        }
    }
    if (invalidAssociations && invalidAssociations.length > 0) {
        invalidAssociations.map((item: string) => {
            associatedData[item] = [
                {
                    error: 'we currently do not support this association object,please contact us for more information.',
                },
            ];
        });
    }

    return associatedData;
};

export const isValidAssociationTypeRequestedByUser = (str: string) => {
    const validStrings = [
        'notes',
        'deals',
        'contacts',
        'leads',
        'companies',
        'events',
        'tasks',
        'users',
        'note',
        'deal',
        'contact',
        'lead',
        'company',
        'event',
        'task',
        'user',
    ];
    return validStrings.includes(str);
};

export function handleHubspotDisunify<T extends Record<string, any>, AssociationType extends AllAssociation>({
    obj,
    objType,
    transformedObj,
}: {
    obj: T;
    objType: StandardObjects;
    transformedObj: any;
}) {
    const hubspotObj: any = {
        ...(objType === StandardObjects.user
            ? { ...transformedObj }
            : {
                  ...{
                      properties: {
                          ...transformedObj,
                          ...(obj.associations && {}),
                      },
                  },
              }),
    };
    // Map custom fields
    if (obj.additional) {
        Object.keys(obj.additional).forEach((key) => {
            if (key !== 'associations') {
                hubspotObj['properties'][key] = obj.additional?.[key];
            }
        });
    }
    // legacy associations implementation
    if (obj.additional?.associations) {
        hubspotObj['associations'] = obj.additional.associations;
    }
    if (obj.associations) {
        const associationObj = obj.associations;
        const associationArr = Object.keys(associationObj).map((key) => {
            return {
                to: {
                    id: associationObj[key as AssociationType],
                },
                types: [getHubspotAssociationObj(key as AssociationType, objType)],
            };
        });
        hubspotObj['associations'] = associationArr;
    }
    return hubspotObj;
}
