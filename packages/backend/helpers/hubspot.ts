import { AllAssociation } from "../constants/common";

export const getHubspotAssociationObj = (key: AllAssociation) => {
    switch (key) {
        case 'dealId': {
            return {
                associationCategory: 'HUBSPOT_DEFINED',
                associationTypeId: 214,
            };
            break;
        }
        default: {
            return {};
        }
    }
};
