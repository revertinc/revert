import { NoteAssociation } from '../../constants/associations';

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
