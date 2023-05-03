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
    associations?: any; // TODO: Support associations
    additional?: any; // TODO: Handle additional fields
}

export function unifyEvent(event: any): UnifiedEvent {
    const unifiedEvent: UnifiedEvent = {
        remoteId: event.id || event.Id,
        id: event.id || event.eventID || event.event_id,
        createdTimestamp: event.createdDate || event.CreatedDate || event.Created_Time || event.hs_timestamp,
        updatedTimestamp: event.lastModifiedDate || event.LastModifiedDate || event.Modified_Time,
        type: event.type || event.Type || event.hs_activity_type,
        subject: event.subject || event.Subject,
        description: event.description || event.Description || event.hs_meeting_body,
        isAllDayEvent: event.All_day,
        startDateTime: event.Start_DateTime || event.hs_meeting_start_time,
        endDateTime: event.End_DateTime || event.hs_meeting_end_time,
        location: event.hs_meeting_location || event.location || event.Location,
    };

    // Map additional fields
    Object.keys(event).forEach((key) => {
        if (!(key in unifiedEvent)) {
            unifiedEvent['additional'][key] = event[key];
        }
    });

    return unifiedEvent;
}
