import { StandardObjects } from '../../constants/common';

export function handleZohoDisunify<T extends Record<string, any>>({
    obj,
    objType,
    transformedObj,
}: {
    obj: T;
    objType: StandardObjects;
    transformedObj: any;
}) {
    const zohoObj: any = {
        data: [
            {
                ...getZohoAssociation(obj, objType),
                ...transformedObj,
            },
        ],
        apply_feature_execution: [
            {
                name: 'layout_rules',
            },
        ],
        trigger: ['approval', 'workflow', 'blueprint'],
    };
    // Map custom fields
    if (obj.additional) {
        Object.keys(obj.additional).forEach((key) => {
            if (
                objType !== StandardObjects.contact ||
                (objType === StandardObjects.contact && key !== 'Contact_Role')
            ) {
                zohoObj.data[0][key] = obj.additional?.[key];
            }
        });
    }
    return zohoObj;
}

const getZohoAssociation = (obj: any, objType: StandardObjects) => {
    switch (objType) {
        case StandardObjects.note: {
            return {
                ...(obj.associations?.dealId && {
                    Parent_Id: obj.associations.dealId,
                    se_module: 'Deals',
                }),
            };
        }
        case StandardObjects.event:
        case StandardObjects.task: {
            return {
                ...(obj.associations?.dealId && { What_Id: obj.associations.dealId, $se_module: 'Deals' }),
                ...(obj.associations?.contactId && {
                    Who_Id: obj.associations.contactId,
                    $se_module: 'Contacts',
                }),
            };
        }
        default: {
            return {};
        }
    }
};
