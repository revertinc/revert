import { AllAssociation } from '../../constants/common';
import { Subtype } from '../../constants/typeHelpers';

export type EventAssociation = Subtype<AllAssociation, 'dealId' | 'contactId'>;

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
