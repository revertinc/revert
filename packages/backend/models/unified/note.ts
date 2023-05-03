export interface UnifiedNote {
    content: string;
    id: string;
    remoteId: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: any; // TODO: Support associations
    additional?: any; // TODO: Handle additional fields
}

export function unifyNote(note: any): UnifiedNote {
    const unifiednote: UnifiedNote = {
        remoteId: note.id || note.Id,
        id: note.id || note.noteID || note.note_id,
        createdTimestamp: note.createdDate || note.CreatedDate || note.Created_Time || note.hs_timestamp,
        updatedTimestamp: note.lastModifiedDate || note.LastModifiedDate || note.Modified_Time,
        content: note.content || note.hs_note_body || note.Body || note.Note_Content,
    };

    // Map additional fields
    Object.keys(note).forEach((key) => {
        if (!(key in unifiednote)) {
            unifiednote['additional'][key] = note[key];
        }
    });

    return unifiednote;
}
