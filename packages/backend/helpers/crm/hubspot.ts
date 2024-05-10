import axios from 'axios';
import { AllAssociation } from '../../constants/associations';
import { StandardObjects } from '../../constants/common';

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

export async function fetchAssociationsDetails(type: string, ids: any[], thirdPartyToken: string) {
    try {
        if (ids.length === 0) return [];

        const data = JSON.stringify({ inputs: ids });
        const responses = await axios({
            method: 'post',
            url: `https://api.hubapi.com/crm/v3/objects/${type}/batch/read`,
            headers: {
                authorization: `Bearer ${thirdPartyToken}`,
                'Content-Type': 'application/json',
            },
            data: data,
        });

        return responses.data.results;
    } catch (error) {
        console.log('Failed to fetch associations details from hubspot', error);
    }
}
