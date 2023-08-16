import { AllAssociation } from '../constants/common';

export const getHubspotAssociationObj = (
    key: AllAssociation,
    associateObj: 'note' | 'deal' | 'contact' | 'lead' | 'company' | 'event' | 'task'
) => {
    const associationTypeMapping: {
        [x in typeof associateObj]: { [y in AllAssociation]: number | undefined };
    } = {
        note: {
            dealId: 214,
            companyId: 190,
            contactId: 202,
            leadId: 202,
            noteId: undefined,
        },
        deal: {
            contactId: 3,
            leadId: 3,
            companyId: 341,
            noteId: 213,
            dealId: undefined,
        },
        contact: {
            companyId: 279,
            dealId: 4,
            noteId: 201,
            leadId: undefined,
            contactId: undefined,
        },
        lead: {
            companyId: 279,
            dealId: 4,
            noteId: 201,
            contactId: undefined,
            leadId: undefined,
        },
        company: {
            contactId: 280,
            leadId: 280,
            dealId: 342,
            noteId: 189,
            companyId: undefined,
        },
        event: {
            contactId: 200,
            leadId: 601,
            dealId: 212,
            noteId: undefined,
            companyId: 188,
        },
        task: {
            contactId: 204,
            leadId: undefined,
            dealId: 216,
            noteId: undefined,
            companyId: 192,
        },
    };
    const associationTypeId = associationTypeMapping[associateObj][key];
    if (associationTypeId) {
        return {
            associationCategory: 'HUBSPOT_DEFINED',
            associationTypeId,
        };
    }
    return null;
};
