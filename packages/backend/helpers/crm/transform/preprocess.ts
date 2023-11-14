import { TP_ID } from '@prisma/client';
import { CRM_TP_ID, StandardObjects } from '../../../constants/common';
import { PipedriveDealStatus } from '../../../constants/pipedrive';

export const preprocessUnifyObject = <T extends Record<string, any>>({
    obj,
    tpId,
    objType,
}: {
    obj: T;
    tpId: CRM_TP_ID;
    objType: StandardObjects;
}) => {
    const preprocessMap: any = {
        [TP_ID.pipedrive]: {
            [StandardObjects.deal]: (obj: T) => {
                return {
                    ...obj,
                    revert_isWon: obj.status === PipedriveDealStatus.won,
                };
            },
        },
        [TP_ID.zohocrm]: {
            [StandardObjects.deal]: (obj: T) => {
                return {
                    ...obj,
                    revert_isWon: obj.Stage === 'Closed (Won)',
                };
            },
        },
        [TP_ID.closecrm]: {
            [StandardObjects.contact]: (obj: T) => {
                if (obj.name) {
                    const names = obj.name.split(' ');
                    const modifiedObj = {
                        ...obj,
                        firstName: names[0],
                        lastName: names[1],
                    };
                    console.log(
                        'DEBUG',
                        'lalsdjaslkdjlsjdlasdlasjdlasdlasjdlasdkaljdlajsdlaksdjlasjdlajsdlajad',
                        modifiedObj
                    );
                    return modifiedObj;
                }
                return { ...obj };
            },
        },
    };
    const transformFn = (preprocessMap[tpId] || {})[objType];
    return transformFn ? transformFn(obj) : obj;
};

export const postprocessDisUnifyObject = <T extends Record<string, any>>({
    obj,
    tpId,
    objType,
}: {
    obj: T;
    tpId: CRM_TP_ID;
    objType: StandardObjects;
}) => {
    const preprocessMap: Record<CRM_TP_ID, Record<any, Function>> = {
        [TP_ID.pipedrive]: {
            [StandardObjects.event]: (obj: T) => {
                return {
                    ...obj,
                    type: 'meeting',
                };
            },
            [StandardObjects.task]: (obj: T) => {
                return {
                    ...obj,
                    type: 'task',
                };
            },
            [StandardObjects.deal]: (obj: T) => {
                return {
                    ...obj,
                    status: obj.revert_isWon ? PipedriveDealStatus.won : PipedriveDealStatus.open,
                    revert_isWon: undefined,
                };
            },
            [StandardObjects.contact]: (obj: T) => {
                return {
                    ...obj,
                    name: `${obj.first_name} ${obj.last_name}`,
                };
            },
            [StandardObjects.lead]: (obj: T) => {
                return {
                    ...obj,
                    person: undefined,
                };
            },
        },
        [TP_ID.sfdc]: {
            [StandardObjects.deal]: (obj: T) => {
                return {
                    ...obj,
                    Probability: Number(obj.Probability) * 100,
                };
            },
            [StandardObjects.company]: (obj: T) => {
                return {
                    ...obj,
                    Type: obj.additional?.type,
                };
            },
        },
        [TP_ID.zohocrm]: {
            [StandardObjects.deal]: (obj: T) => {
                return {
                    ...obj,
                    Probability: Number(obj.Probability) * 100,
                };
            },
            [StandardObjects.company]: (obj: T) => {
                return {
                    ...obj,
                    Account_Type: obj.additional?.type,
                };
            },
        },
        [TP_ID.hubspot]: {
            [StandardObjects.event]: (obj: T) => {
                return {
                    ...obj,
                    hs_timestamp: Date.now().toString(),
                };
            },
            [StandardObjects.note]: (obj: T) => {
                return {
                    ...obj,
                    hs_timestamp: Date.now().toString(),
                };
            },
            [StandardObjects.task]: (obj: T) => {
                return {
                    ...obj,
                    hs_timestamp: Date.now().toString(),
                };
            },
        },
        [TP_ID.closecrm]: {
            // [StandardObjects.note]: (obj: T) => {
            //     return {
            //         ...obj,
            //         lead_id: 'lead_u1ETw8SoeXST0FXO8V7OdxEwD67q3SwGjROpbUHy6sV',
            //     };
            // },
            // [StandardObjects.contact]: (obj: T) => {
            //     console.log('DEBUG', 'From preprocess closecrm', obj);
            //     return {
            //         ...obj,
            //         name: `${obj.firstName} ${obj.lastName}`,
            //     };
            // },
        },
    };
    const transformFn = (preprocessMap[tpId] || {})[objType];
    return transformFn ? transformFn(obj) : obj;
};
