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

    if (objType === StandardObjects.task) {
        /*
        Microsoft Priority codes
            0 : Low
            1 : Normal
            2 : High
    */
        if (obj.priority !== undefined && obj.priority !== null) {
            let priority = null;
            if (obj.priority === 'low') priority = 0;
            else if (obj.priority === 'normal') priority = 1;
            else if (obj.priority === 'high') priority = 2;
            transformedObj.prioritycode = priority;
            if (transformedObj.priority) delete transformedObj.priority;
        }
        /*
        Microsoft state code
            0 : Open
            1 : Completed
            2 : Canceled
     */
        if (obj.status !== undefined && obj.status !== null) {
            let status = null;
            if (obj.status === 'open') status = 0;
            else if (obj.status == 'completed') status = 1;
            else if (obj.status == 'canceled') status = 2;
            transformedObj.statecode = status;
            if (transformedObj.status) delete transformedObj.status;
        }
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

    if (objType === StandardObjects.deal) {
        if (obj.probability) transformedObj.closeprobability = obj.probability * 100;

        if (obj.priority) {
            const priority = String(obj.priority).toLowerCase();
            if (priority === 'hot') transformedObj.opportunityratingcode = 1;
            else if (priority === 'warm') transformedObj.opportunityratingcode = 2;
            else if (priority === 'cold') transformedObj.opportunityratingcode = 3;
        }

        if (obj.stage) {
            const stage = String(obj.stage).toLowerCase();
            if (stage === 'qualify') transformedObj.salesstagecode = 0;
            else if (stage === 'develop') transformedObj.salesstagecode = 1;
            else if (stage === 'propose') transformedObj.salesstagecode = 2;
            else if (stage === 'close') transformedObj.salesstagecode = 3;
        }

        transformedObj.statecode = obj.isWon ? 1 : 0;
    }

    if (objType === StandardObjects.company) {
        if (obj.address && obj.address.street) transformedObj.address1_line1 = obj.address.street;
        if (transformedObj.address_street) delete transformedObj.address_street;
    }

    if (objType === StandardObjects.event) {
        // MS Dynamics Behaviour if companyId is present contact id gets ignored
        if (obj.associations) {
            if (obj.associations.contactId)
                transformedObj['regardingobjectid_contact@odata.bind'] = `/contacts(${obj.associations.contactId})`;
            if (obj.associations.companyId)
                transformedObj['regardingobjectid_account@odata.bind'] = `/accounts(${obj.associations.companyId})`;
        }
    }

    return transformedObj;
}
