export interface UnifiedNote {
    content: string;
    id: string;
    remoteId: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: any; // TODO: Support associations
    additional: any;
}

export function unifyNote(note: any): UnifiedNote {
    const unifiednote: UnifiedNote = {
        remoteId: note.id || note.Id,
        id: note.id || note.noteID || note.note_id,
        createdTimestamp:
            note.createdDate || note.CreatedDate || note.Created_Time || note.hs_timestamp || note.hs_createdate,
        updatedTimestamp:
            note.lastModifiedDate || note.LastModifiedDate || note.Modified_Time || note.hs_lastmodifieddate,
        content: note.content || note.hs_note_body || note.Body || note.Note_Content,
        additional: {},
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
    const salesforceEvent: any = {
        Id: unified.remoteId,
        Body: unified.content,
    };

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            salesforceEvent[key] = unified.additional?.[key];
        });
    }
    return salesforceEvent;
}

export function toZohoNote(unified: UnifiedNote): any {
    const zoho: any = {};
    zoho.Note_Content = unified.content;
    zoho.id = unified.remoteId;

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            zoho[key] = unified.additional?.[key];
        });
    }
    return zoho;
}

export function toHubspotNote(unified: UnifiedNote): any {
    const hubspotEvent: any = {
        hs_object_id: unified.remoteId,
        hs_note_body: unified.content,
    };

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            hubspotEvent[key] = unified.additional?.[key];
        });
    }

    return hubspotEvent;
}

export function disunifyNote(note: UnifiedNote, integrationId: string): any {
    if (integrationId === 'sfdc') {
        return toSalesforceNote(note);
    } else if (integrationId === 'hubspot') {
        return toHubspotNote(note);
    } else if (integrationId === 'zohocrm') {
        return toZohoNote(note);
    }
}
