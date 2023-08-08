import { TP_ID } from '@prisma/client';
import { AllAssociation } from '../../constants/common';
import { Subtype } from '../../constants/typehelpers';
import { getHubspotAssociationObj } from '../../helpers/hubspot';

export type EventAssociation = Subtype<AllAssociation, 'dealId'>;

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

export function unifyEvent(event: any): UnifiedEvent {
    const unifiedEvent: UnifiedEvent = {
        remoteId: event.id || event.Id,
        id: event.id || event.eventID || event.event_id || event.Id,
        createdTimestamp:
            event.createdDate ||
            event.CreatedDate ||
            event.Created_Time ||
            event.hs_timestamp ||
            event.hs_createdate ||
            event.add_time,
        updatedTimestamp:
            event.lastModifiedDate ||
            event.LastModifiedDate ||
            event.Modified_Time ||
            event.hs_lastmodifieddate ||
            event.update_time,
        type: event.type || event.Type || event.hs_activity_type || event.EventSubtype, // Note: No Type field in zoho
        subject: event.subject || event.Subject || event.hs_meeting_title || event.Event_Title,
        description: event.description || event.Description || event.hs_meeting_body || event.public_description,
        isAllDayEvent: event.All_day || event.isAllDay || event.IsAllDayEvent || false,
        startDateTime: event.Start_DateTime || event.hs_meeting_start_time || event.StartDateTime || event.add_time,
        endDateTime: event.End_DateTime || event.hs_meeting_end_time || event.EndDateTime || event.due_time,
        location: event.hs_meeting_location || event.location || event.Location || event.Venue,
        additional: {},
    };

    // Map additional fields
    Object.keys(event).forEach((key) => {
        if (!(key in unifiedEvent)) {
            unifiedEvent['additional'][key] = event[key];
        }
    });

    return unifiedEvent;
}

export function toSalesforceEvent(unified: UnifiedEvent): any {
    const salesforceEvent: any = {
        Id: unified.remoteId,
        Type: unified.type,
        Subject: unified.subject,
        StartDateTime: unified.startDateTime,
        EndDateTime: unified.endDateTime,
        IsAllDayEvent: unified.isAllDayEvent,
        Location: unified.location,
        Description: unified.description,
    };

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            salesforceEvent[key] = unified.additional?.[key];
        });
    }
    return salesforceEvent;
}

export function toZohoEvent(unified: UnifiedEvent): any {
    const zoho: any = {
        data: [{}],
        apply_feature_execution: [
            {
                name: 'layout_rules',
            },
        ],
        trigger: ['approval', 'workflow', 'blueprint'],
    };
    zoho.data[0].Type = unified.type;
    zoho.data[0].id = unified.remoteId;
    zoho.data[0].Event_Title = unified.subject;
    zoho.data[0].Start_DateTime = unified.startDateTime;
    zoho.data[0].End_DateTime = unified.endDateTime;
    zoho.data[0].All_day = unified.isAllDayEvent;
    zoho.data[0].Location = unified.location;
    zoho.data[0].Description = unified.description;

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            zoho.data[0][key] = unified.additional?.[key];
        });
    }
    return zoho;
}

export function toHubspotEvent(unifiedEvent: UnifiedEvent): any {
    const hubspotEvent: any = {
        properties: {
            id: unifiedEvent.remoteId,
            hs_activity_type: unifiedEvent.type,
            hs_meeting_title: unifiedEvent.subject,
            hs_meeting_start_time: unifiedEvent.startDateTime,
            hs_meeting_end_time: unifiedEvent.endDateTime,
            hs_meeting_location: unifiedEvent.location,
            hs_meeting_body: unifiedEvent.description,
            hs_timestamp: Date.now().toString(),
        },
    };

    // Map custom fields
    if (unifiedEvent.additional) {
        Object.keys(unifiedEvent.additional).forEach((key) => {
            hubspotEvent['properties'][key] = unifiedEvent.additional?.[key];
        });
    }

    if (unifiedEvent.associations) {
        const associationObj = unifiedEvent.associations;
        const associationArr = Object.keys(associationObj).map((key) => {
            return {
                to: {
                    id: associationObj[key as EventAssociation],
                },
                types: [getHubspotAssociationObj(key as EventAssociation, 'event')],
            };
        });
        hubspotEvent['associations'] = associationArr;
    }

    return hubspotEvent;
}

export function toPipedriveEvent(unifiedEvent: UnifiedEvent): any {
    const pipedriveEvent: any = {
        id: unifiedEvent.remoteId,
        type: 'meeting',
        subject: unifiedEvent.subject,
        add_time: unifiedEvent.startDateTime,
        due_time: unifiedEvent.endDateTime,
        location: unifiedEvent.location,
        public_description: unifiedEvent.description,
    };

    // Map custom fields
    if (unifiedEvent.additional) {
        Object.keys(unifiedEvent.additional).forEach((key) => {
            pipedriveEvent[key] = unifiedEvent.additional?.[key];
        });
    }

    return pipedriveEvent;
}

export function disunifyEvent(deal: UnifiedEvent, integrationId: string): any {
    if (integrationId === TP_ID.sfdc) {
        return toSalesforceEvent(deal);
    } else if (integrationId === TP_ID.hubspot) {
        return toHubspotEvent(deal);
    } else if (integrationId === TP_ID.zohocrm) {
        return toZohoEvent(deal);
    } else if (integrationId === TP_ID.pipedrive) {
        return toPipedriveEvent(deal);
    }
}
