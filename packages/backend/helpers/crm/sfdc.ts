import { StandardObjects } from '../../constants/common';

export function handleSfdcDisunify<T extends Record<string, any>>({
    obj,
    objType,
    transformedObj,
}: {
    obj: T;
    objType: StandardObjects;
    transformedObj: any;
}) {
    const sfdcObj: any = {
        ...transformedObj,
        ...getSfdcAssociation(obj, objType),
    };
    // Map custom fields
    if (obj.additional) {
        Object.keys(obj.additional).forEach((key) => {
            sfdcObj[key] = obj.additional?.[key];
        });
    }
    return sfdcObj;
}

const getSfdcAssociation = (obj: any, objType: StandardObjects) => {
    switch (objType) {
        case StandardObjects.note: {
            return {
                ...(obj.associations?.dealId && {
                    parentId: obj.associations.dealId,
                }),
            };
        }
        case StandardObjects.event: {
            return {
                ...(obj.associations?.dealId && {
                    WhatId: obj.associations.dealId,
                }),
                ...(obj.associations?.contactId && {
                    WhoId: obj.associations.contactId,
                }),
            };
        }
        case StandardObjects.task: {
            return {
                ...(obj.associations?.dealId && {
                    WhatId: obj.associations.dealId,
                }),
            };
        }
    }
};
