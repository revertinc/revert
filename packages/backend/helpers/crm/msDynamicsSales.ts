import { StandardObjects } from '../../constants/common';

export function handleMSDynamicsSales<T extends Record<string, any>>({
    obj,
    objType,
    transformedObj,
}: {
    obj: T;
    objType: StandardObjects;
    transformedObj: any;
}) {
    if (obj.additional) {
        Object.keys(obj.additional).map((key: any) => (transformedObj[key] = obj.additional[key]));
    }

    if (obj.additional && obj.additional.subject) transformedObj.subject = obj.additional.subject;
    if (objType === StandardObjects.note && obj.additional && obj.additional.entityType && obj.additional.entityId) {
        delete transformedObj.entityType;
        delete transformedObj.entityId;
        const entityType = obj.additional.entityType;
        const entityId = obj.additional.entityId;
        const pluralForm = entityType !== 'opportunity' ? entityType + 's' : 'opportunities';
        const path = `/${pluralForm}(${entityId})`;
        const pathKey = `objectid_${entityType}@odata.bind`;

        if (obj.additional.subject) transformedObj.subject = obj.additional.subject;

        return {
            ...transformedObj,
            [pathKey]: path,
        };
    }
    return transformedObj;
}
