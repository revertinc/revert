import { NoteAssociation } from '../models/unified';

export const getHubspotAssociationObj = (key: NoteAssociation) => {
    switch (key) {
        case 'dealId': {
            return {
                associationCategory: 'HUBSPOT_DEFINED',
                associationTypeId: 214,
            };
        }
        default: {
            return {};
        }
    }
};
