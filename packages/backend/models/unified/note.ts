import { TP_ID } from '@prisma/client';

export interface UnifiedNote {
    content: string;
    id: string;
    remoteId: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: any; // TODO: Support associations
    additional: any;
    noteType?: 'PERSON' | 'ORGANIZATION' | 'LEAD' | 'DEAL'; // for pipedrive
    noteTypeId?: string; // for pipedrive
}

export function unifyNote(note: any): UnifiedNote {
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
        noteType: !!note.person_id
            ? 'PERSON'
            : !!note.org_id
            ? 'ORGANIZATION'
            : !!note.lead_id
            ? 'LEAD'
            : !!note.deal_id
            ? 'DEAL'
            : undefined,
        noteTypeId: note.person_id || note.org_id || note.lead_id || note.deal_id,
    };

    // Map additional fields
    Object.keys(note).forEach((key) => {
        if (!(key in unifiednote)) {
            unifiednote['additional'][key] = note[key];
        }
    });

    return unifiednote;
}

export function toSalesforceNote(unified: UnifiedNote): any {
    const salesforceNote: any = {
        Id: unified.remoteId,
        Body: unified.content,
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
        data: [{}],
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

    return hubspotNote;
}

export function toPipedriveNote(unified: UnifiedNote): any {
    const pipedriveNote: any = {
        id: unified.remoteId,
        content: unified.content,
        add_time: unified.createdTimestamp,
        update_time: unified.updatedTimestamp,
        ...(unified.noteType === 'PERSON' && {
            person_id: unified.noteTypeId,
        }),
        ...(unified.noteType === 'ORGANIZATION' && {
            org_id: unified.noteTypeId,
        }),
        ...(unified.noteType === 'LEAD' && {
            lead_id: unified.noteTypeId,
        }),
        ...(unified.noteType === 'DEAL' && {
            deal_id: unified.noteTypeId,
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
    // TODO: Handle associations creation elsewhere as well.
    if (unified.additional?.associations) {
        pipedriveNote['associations'] = unified.additional.associations;
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
