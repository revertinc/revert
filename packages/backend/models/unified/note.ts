import { TP_ID } from '@prisma/client';
import { getHubspotAssociationObj } from '../../helpers/hubspot';
import { Subtype } from '../../constants/typeHelpers';
import { AllAssociation } from '../../constants/common';

export type NoteAssociation = Subtype<AllAssociation, 'contactId' | 'companyId' | 'leadId' | 'dealId'>;

export interface UnifiedNote {
    content: string;
    id: string;
    remoteId: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: {
        [x in NoteAssociation]?: string;
    };
    additional: any;
}

export function unifyNote(note: any, tpId: TP_ID): UnifiedNote {
    const unifiednote: UnifiedNote = {
        remoteId: note.id || note.Id,
        id: note.id || note.noteID || note.note_id || note.Id,
        createdTimestamp:
            note.createdDate ||
            note.CreatedDate ||
            note.Created_Time ||
            note.hs_timestamp ||
            note.hs_createdate ||
            note.add_time,
        updatedTimestamp:
            note.lastModifiedDate ||
            note.LastModifiedDate ||
            note.Modified_Time ||
            note.hs_lastmodifieddate ||
            note.update_time,
        content: note.content || note.hs_note_body || note.Body || note.Note_Content,
        additional: {},
        associations: {
            ...(tpId === TP_ID.pipedrive && {
                contactId: note.person_id,
                companyId: note.org_id,
                leadId: note.lead_id,
                dealId: note.deal_id,
            }),
        },
    };

    // Map additional fields
    Object.keys(note).forEach((key) => {
        if (!(key in unifiednote) && key !== 'properties') {
            unifiednote['additional'][key] = note[key];
        }
    });

    return unifiednote;
}

export function toSalesforceNote(unified: UnifiedNote): any {
    const salesforceNote: any = {
        Id: unified.remoteId,
        Body: unified.content,
        ...(unified.associations?.dealId && {
            parentId: unified.associations.dealId,
        }),
    };

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            salesforceNote[key] = unified.additional?.[key];
        });
    }
    return salesforceNote;
}

export function toZohoNote(unified: UnifiedNote): any {
    const zoho: any = {
        data: [
            {
                ...(unified.associations?.dealId && {
                    Parent_Id: unified.associations.dealId,
                    se_module: 'Deals',
                }),
            },
        ],
        apply_feature_execution: [
            {
                name: 'layout_rules',
            },
        ],
        trigger: ['approval', 'workflow', 'blueprint'],
    };
    zoho.data[0].Note_Content = unified.content;
    zoho.data[0].id = unified.remoteId;

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            zoho.data[0][key] = unified.additional?.[key];
        });
    }
    return zoho;
}

export function toHubspotNote(unified: UnifiedNote): any {
    const hubspotNote: any = {
        properties: {
            id: unified.remoteId,
            hs_note_body: unified.content,
            hs_timestamp: Date.now().toString(),
            ...(unified.associations && {}),
        },
    };

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            if (key !== 'associations') {
                hubspotNote['properties'][key] = unified.additional?.[key];
            }
        });
    }
    // TODO: Handle associations creation elsewhere as well.
    if (unified.additional?.associations) {
        hubspotNote['associations'] = unified.additional.associations;
    }
    if (unified.associations) {
        const associationObj = unified.associations;
        const associationArr = Object.keys(associationObj).map((key) => {
            return {
                to: {
                    id: associationObj[key as NoteAssociation],
                },
                types: [getHubspotAssociationObj(key as NoteAssociation, 'note')],
            };
        });
        hubspotNote['associations'] = associationArr;
    }

    return hubspotNote;
}

export function toPipedriveNote(unified: UnifiedNote): any {
    const pipedriveNote: any = {
        id: unified.remoteId,
        content: unified.content,
        add_time: unified.createdTimestamp,
        update_time: unified.updatedTimestamp,
        ...(unified.associations?.contactId && {
            person_id: unified.associations.contactId,
        }),
        ...(unified.associations?.companyId && {
            organization_id: unified.associations.companyId,
        }),
        ...(unified.associations?.leadId && {
            lead_id: unified.associations.leadId,
        }),
        ...(unified.associations?.dealId && {
            deal_id: unified.associations.dealId,
        }),
    };

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            if (key !== 'associations') {
                pipedriveNote[key] = unified.additional?.[key];
            }
        });
    }

    return pipedriveNote;
}

export function disunifyNote(note: UnifiedNote, integrationId: string): any {
    if (integrationId === TP_ID.sfdc) {
        return toSalesforceNote(note);
    } else if (integrationId === TP_ID.hubspot) {
        return toHubspotNote(note);
    } else if (integrationId === TP_ID.zohocrm) {
        return toZohoNote(note);
    } else if (integrationId === TP_ID.pipedrive) {
        return toPipedriveNote(note);
    }
}
