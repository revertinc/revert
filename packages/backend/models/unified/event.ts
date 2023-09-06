import { EventAssociation } from '../../constants/associations';

export interface UnifiedEvent {
    type: string;
    subject: string;
    startDateTime: string;
    endDateTime: string;
    isAllDayEvent: boolean;
    description: string;
    id: string;
    location: string;
    remoteId: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: {
        [x in EventAssociation]?: string;
    };
    additional: any;
}
