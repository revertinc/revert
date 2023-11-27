export default function handleCloseCRMDisunify<T extends Record<string, any>>({
    obj,
    transformedObj,
}: {
    obj: T;
    transformedObj: any;
}) {
    if (obj.firstName && obj.lastName) {
        transformedObj['name'] = `${obj.firstName} ${obj.lastName}`;
    } else if (obj.firstName) {
        transformedObj['name'] = `${obj.firstName}`;
    } else if (obj.lastName) {
        transformedObj['name'] = `${obj.lastName}`;
    }

    ['phones', 'emails'].forEach((key) => {
        if (transformedObj[key] && transformedObj[key].constructor === Object) {
            transformedObj[key] = Object.values(transformedObj[key]);
        }
    });

    if (obj.associations) {
        transformedObj['lead_id'] = obj.associations.leadId;
    }

    return transformedObj;
}
