import { TP_ID } from '@prisma/client';
import { StandardObjects } from '../../../constants/common';
import { PipedriveDealStatus } from '../../../constants/pipedrive';

export const preprocessUnifyObject = <T extends Record<string, any>>({
    obj,
    tpId,
    objType,
}: {
    obj: T;
    tpId: TP_ID;
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
    };
    const transformFn = (preprocessMap[tpId] || {})[objType];
    return transformFn ? transformFn(obj) : obj;
};

export const preprocessDisUnifyObject = <T extends Record<string, any>>({
    obj,
    tpId,
    objType,
}: {
    obj: T;
    tpId: TP_ID;
    objType: StandardObjects;
}) => {
    const preprocessMap: any = {
        [TP_ID.pipedrive]: {
            [StandardObjects.event]: (obj: T) => {
                return {
                    ...obj,
                    revert_type: 'meeting',
                };
            },
        },
    };
    const transformFn = (preprocessMap[tpId] || {})[objType];
    return transformFn ? transformFn(obj) : obj;
};
