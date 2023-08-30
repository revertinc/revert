// TODO: type this?
export const mapPipedriveObjectCustomFields = ({ object, objectFields }: { object: any; objectFields: any }) => {
    const mappedCustomFields: Record<string, any> = {};
    Object.keys(object).forEach((k) => {
        const a = objectFields.find((p: any) => p.key === k)?.name;
        if (
            a &&
            !Object.keys(object)
                .map((b) => b.toLowerCase())
                .includes(a.toLowerCase())
        ) {
            mappedCustomFields[a] = object?.[k];
        }
    });
    return {
        ...object,
        ...mappedCustomFields,
    };
};
