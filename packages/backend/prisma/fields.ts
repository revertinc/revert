import { TP_ID } from '@prisma/client';
import { ChatStandardObjects, StandardObjects, TicketStandardObjects } from '../constants/common';

// root schema mapping
export const allFields = {
    [StandardObjects.note]: [
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_note_body',
                [TP_ID.pipedrive]: 'content',
                [TP_ID.sfdc]: 'Body',
                [TP_ID.zohocrm]: 'Note_Content',
                [TP_ID.closecrm]: 'note_html',
            },
            target_field_name: 'content',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'id',
                [TP_ID.pipedrive]: 'id',
                [TP_ID.sfdc]: 'Id',
                [TP_ID.zohocrm]: 'id',
                [TP_ID.closecrm]: 'id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'id',
                [TP_ID.pipedrive]: 'id',
                [TP_ID.sfdc]: 'Id',
                [TP_ID.zohocrm]: 'id',
                [TP_ID.closecrm]: 'id',
            },
            target_field_name: 'remoteId',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_createdate',
                [TP_ID.pipedrive]: 'add_time',
                [TP_ID.sfdc]: 'CreatedDate',
                [TP_ID.zohocrm]: 'Created_Time',
                [TP_ID.closecrm]: 'date_created',
            },
            target_field_name: 'createdTimestamp',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_lastmodifieddate',
                [TP_ID.pipedrive]: 'update_time',
                [TP_ID.sfdc]: 'LastModifiedDate',
                [TP_ID.zohocrm]: 'Modified_Time',
                [TP_ID.closecrm]: 'date_updated',
            },
            target_field_name: 'updatedTimestamp',
        },
    ],
    [StandardObjects.contact]: [
        {
            source_field_name: {
                [TP_ID.hubspot]: 'firstname',
                [TP_ID.pipedrive]: 'first_name',
                [TP_ID.sfdc]: 'FirstName',
                [TP_ID.zohocrm]: 'First_Name',
                [TP_ID.closecrm]: 'firstName', //@TODO closecrm does not provide firstname and lastname
            },
            target_field_name: 'firstName',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'lastname',
                [TP_ID.pipedrive]: 'last_name',
                [TP_ID.sfdc]: 'LastName',
                [TP_ID.zohocrm]: 'Last_Name',
                [TP_ID.closecrm]: 'lastName', //@TODO closecrm does not provide firstname and lastname
            },
            target_field_name: 'lastName',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'phone',
                [TP_ID.pipedrive]: 'phone.0.value',
                [TP_ID.sfdc]: 'Phone',
                [TP_ID.zohocrm]: 'Phone',
                [TP_ID.closecrm]: 'phones.0.phone',
            },
            target_field_name: 'phone',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'email',
                [TP_ID.pipedrive]: 'email.0.value',
                [TP_ID.sfdc]: 'Email',
                [TP_ID.zohocrm]: 'Email',
                [TP_ID.closecrm]: 'emails.0.email',
            },
            target_field_name: 'email',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'id',
                [TP_ID.pipedrive]: 'id',
                [TP_ID.sfdc]: 'Id',
                [TP_ID.zohocrm]: 'id',
                [TP_ID.closecrm]: 'id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'id',
                [TP_ID.pipedrive]: 'id',
                [TP_ID.sfdc]: 'Id',
                [TP_ID.zohocrm]: 'id',
                [TP_ID.closecrm]: 'id',
            },
            target_field_name: 'remoteId',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_createdate',
                [TP_ID.pipedrive]: 'add_time',
                [TP_ID.sfdc]: 'CreatedDate',
                [TP_ID.zohocrm]: 'Created_Time',
                [TP_ID.closecrm]: 'date_created',
            },
            target_field_name: 'createdTimestamp',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_lastmodifieddate',
                [TP_ID.pipedrive]: 'update_time',
                [TP_ID.sfdc]: 'LastModifiedDate',
                [TP_ID.zohocrm]: 'Modified_Time',
                [TP_ID.closecrm]: 'date_updated',
            },
            target_field_name: 'updatedTimestamp',
        },
    ],
    [StandardObjects.company]: [
        {
            source_field_name: {
                [TP_ID.hubspot]: 'name',
                [TP_ID.pipedrive]: 'name',
                [TP_ID.sfdc]: 'Name',
                [TP_ID.zohocrm]: 'Account_Name',
                [TP_ID.closecrm]: 'name',
            },
            target_field_name: 'name',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'industry',
                [TP_ID.pipedrive]: undefined,
                [TP_ID.sfdc]: 'Industry',
                [TP_ID.zohocrm]: 'Industry',
                [TP_ID.closecrm]: '',
            },
            target_field_name: 'industry',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'description',
                [TP_ID.pipedrive]: undefined,
                [TP_ID.sfdc]: 'Description',
                [TP_ID.zohocrm]: 'Description',
                [TP_ID.closecrm]: '',
            },
            target_field_name: 'description',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'annualrevenue',
                [TP_ID.pipedrive]: undefined,
                [TP_ID.sfdc]: 'AnnualRevenue',
                [TP_ID.zohocrm]: 'Annual_Revenue',
                [TP_ID.closecrm]: '',
            },
            target_field_name: 'annualRevenue',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'numberofemployees',
                [TP_ID.pipedrive]: 'people_count',
                [TP_ID.sfdc]: 'NumberOfEmployees',
                [TP_ID.zohocrm]: 'Employees',
                [TP_ID.closecrm]: '',
            },
            target_field_name: 'size',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'phone',
                [TP_ID.pipedrive]: undefined,
                [TP_ID.sfdc]: 'Phone',
                [TP_ID.zohocrm]: 'Phone',
                [TP_ID.closecrm]: '',
            },
            target_field_name: 'phone',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: undefined,
                [TP_ID.pipedrive]: 'address_street_number',
                [TP_ID.sfdc]: 'BillingStreet',
                [TP_ID.zohocrm]: 'Billing_Street',
                [TP_ID.closecrm]: '',
            },
            target_field_name: 'address.street',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'city',
                [TP_ID.pipedrive]: 'address_locality',
                [TP_ID.sfdc]: 'BillingCity',
                [TP_ID.zohocrm]: 'Billing_City',
                [TP_ID.closecrm]: '',
            },
            target_field_name: 'address.city',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'state',
                [TP_ID.pipedrive]: undefined,
                [TP_ID.sfdc]: 'BillingState',
                [TP_ID.zohocrm]: 'Billing_State',
                [TP_ID.closecrm]: '',
            },
            target_field_name: 'address.state',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'country',
                [TP_ID.pipedrive]: 'address_country',
                [TP_ID.sfdc]: 'BillingCountry',
                [TP_ID.zohocrm]: 'Billing_Country',
                [TP_ID.closecrm]: '',
            },
            target_field_name: 'address.country',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'zip',
                [TP_ID.pipedrive]: 'address_postal_code',
                [TP_ID.sfdc]: 'BillingPostalCode',
                [TP_ID.zohocrm]: 'Billing_Code',
                [TP_ID.closecrm]: '',
            },
            target_field_name: 'address.zip',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'zip',
                [TP_ID.pipedrive]: 'address_postal_code',
                [TP_ID.sfdc]: 'BillingPostalCode',
                [TP_ID.zohocrm]: 'Billing_Code',
                [TP_ID.closecrm]: '',
            },
            target_field_name: 'address.postalCode',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'id',
                [TP_ID.pipedrive]: 'id',
                [TP_ID.sfdc]: 'Id',
                [TP_ID.zohocrm]: 'id',
                [TP_ID.closecrm]: '',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'id',
                [TP_ID.pipedrive]: 'id',
                [TP_ID.sfdc]: 'Id',
                [TP_ID.zohocrm]: 'id',
                [TP_ID.closecrm]: '',
            },
            target_field_name: 'remoteId',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_createdate',
                [TP_ID.pipedrive]: 'add_time',
                [TP_ID.sfdc]: 'CreatedDate',
                [TP_ID.zohocrm]: 'Created_Time',
                [TP_ID.closecrm]: '',
            },
            target_field_name: 'createdTimestamp',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_lastmodifieddate',
                [TP_ID.pipedrive]: 'update_time',
                [TP_ID.sfdc]: 'LastModifiedDate',
                [TP_ID.zohocrm]: 'Modified_Time',
                [TP_ID.closecrm]: '',
            },
            target_field_name: 'updatedTimestamp',
        },
    ],
    [StandardObjects.deal]: [
        {
            source_field_name: {
                [TP_ID.hubspot]: 'amount',
                [TP_ID.pipedrive]: 'value',
                [TP_ID.sfdc]: 'Amount',
                [TP_ID.zohocrm]: 'Amount',
                [TP_ID.closecrm]: 'value',
            },
            target_field_name: 'amount',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_priority',
                [TP_ID.pipedrive]: undefined,
                [TP_ID.sfdc]: 'Priority__c',
                [TP_ID.zohocrm]: 'Priority',
                [TP_ID.closecrm]: undefined,
            },
            target_field_name: 'priority',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'dealstage',
                [TP_ID.pipedrive]: 'stage_id',
                [TP_ID.sfdc]: 'StageName',
                [TP_ID.zohocrm]: 'Stage',
                [TP_ID.closecrm]: 'status_type',
            },
            target_field_name: 'stage',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'dealname',
                [TP_ID.pipedrive]: 'title',
                [TP_ID.sfdc]: 'Name',
                [TP_ID.zohocrm]: 'Deal_Name',
                [TP_ID.closecrm]: 'lead_name',
            },
            target_field_name: 'name',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'closedate',
                [TP_ID.pipedrive]: 'close_time',
                [TP_ID.sfdc]: 'CloseDate',
                [TP_ID.zohocrm]: 'closedate',
                [TP_ID.closecrm]: 'date_won',
            },
            target_field_name: 'expectedCloseDate',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_is_closed_won',
                [TP_ID.pipedrive]: 'revert_isWon', // status === PipedriveDealStatus.won
                [TP_ID.sfdc]: 'IsWon',
                [TP_ID.zohocrm]: 'revert_isWon', // Stage === 'Closed (Won)'
                [TP_ID.closecrm]: 'isWon', // date_won
            },
            target_field_name: 'isWon',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_deal_stage_probability',
                [TP_ID.pipedrive]: 'probability',
                [TP_ID.sfdc]: 'Probability',
                [TP_ID.zohocrm]: 'Probability',
                [TP_ID.closecrm]: 'confidence',
            },
            target_field_name: 'probability',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'id',
                [TP_ID.pipedrive]: 'id',
                [TP_ID.sfdc]: 'Id',
                [TP_ID.zohocrm]: 'id',
                [TP_ID.closecrm]: 'id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'id',
                [TP_ID.pipedrive]: 'id',
                [TP_ID.sfdc]: 'Id',
                [TP_ID.zohocrm]: 'id',
                [TP_ID.closecrm]: 'id',
            },
            target_field_name: 'remoteId',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_createdate',
                [TP_ID.pipedrive]: 'add_time',
                [TP_ID.sfdc]: 'CreatedDate',
                [TP_ID.zohocrm]: 'Created_Time',
                [TP_ID.closecrm]: 'date_created',
            },
            target_field_name: 'createdTimestamp',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_lastmodifieddate',
                [TP_ID.pipedrive]: 'update_time',
                [TP_ID.sfdc]: 'LastModifiedDate',
                [TP_ID.zohocrm]: 'Modified_Time',
                [TP_ID.closecrm]: 'date_updated',
            },
            target_field_name: 'updatedTimestamp',
        },
    ],
    [StandardObjects.event]: [
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_activity_type',
                [TP_ID.pipedrive]: 'revert_type', // 'meeting' for disunify
                [TP_ID.sfdc]: 'Type',
                [TP_ID.zohocrm]: 'Type',
                [TP_ID.closecrm]: '_type',
            },
            target_field_name: 'type',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_meeting_title',
                [TP_ID.pipedrive]: 'subject',
                [TP_ID.sfdc]: 'Subject',
                [TP_ID.zohocrm]: 'Event_Title',
                [TP_ID.closecrm]: 'title',
            },
            target_field_name: 'subject',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_meeting_start_time',
                [TP_ID.pipedrive]: 'due_time',
                [TP_ID.sfdc]: 'StartDateTime',
                [TP_ID.zohocrm]: 'Start_DateTime',
                [TP_ID.closecrm]: 'starts_at',
            },
            target_field_name: 'startDateTime',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_meeting_end_time',
                [TP_ID.pipedrive]: 'end_time',
                [TP_ID.sfdc]: 'EndDateTime',
                [TP_ID.zohocrm]: 'End_DateTime',
                [TP_ID.closecrm]: 'ends_at',
            },
            target_field_name: 'endDateTime',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: undefined,
                [TP_ID.pipedrive]: undefined,
                [TP_ID.sfdc]: 'IsAllDayEvent',
                [TP_ID.zohocrm]: 'All_day',
                [TP_ID.closecrm]: undefined,
            },
            target_field_name: 'isAllDayEvent',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_meeting_body',
                [TP_ID.pipedrive]: 'public_description',
                [TP_ID.sfdc]: 'Description',
                [TP_ID.zohocrm]: 'Description',
                [TP_ID.closecrm]: undefined,
            },
            target_field_name: 'description',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_meeting_location',
                [TP_ID.pipedrive]: 'location',
                [TP_ID.sfdc]: 'Location',
                [TP_ID.zohocrm]: 'Location',
                [TP_ID.closecrm]: 'location',
            },
            target_field_name: 'location',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'id',
                [TP_ID.pipedrive]: 'id',
                [TP_ID.sfdc]: 'Id',
                [TP_ID.zohocrm]: 'id',
                [TP_ID.closecrm]: 'id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'id',
                [TP_ID.pipedrive]: 'id',
                [TP_ID.sfdc]: 'Id',
                [TP_ID.zohocrm]: 'id',
                [TP_ID.closecrm]: 'id',
            },
            target_field_name: 'remoteId',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_createdate',
                [TP_ID.pipedrive]: 'add_time',
                [TP_ID.sfdc]: 'CreatedDate',
                [TP_ID.zohocrm]: 'Created_Time',
                [TP_ID.closecrm]: 'date_created',
            },
            target_field_name: 'createdTimestamp',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_lastmodifieddate',
                [TP_ID.pipedrive]: 'update_time',
                [TP_ID.sfdc]: 'LastModifiedDate',
                [TP_ID.zohocrm]: 'Modified_Time',
                [TP_ID.closecrm]: 'date_updated',
            },
            target_field_name: 'updatedTimestamp',
        },
    ],
    [StandardObjects.lead]: [
        {
            source_field_name: {
                [TP_ID.hubspot]: 'firstname',
                [TP_ID.pipedrive]: 'title',
                [TP_ID.sfdc]: 'FirstName',
                [TP_ID.zohocrm]: 'First_Name',
                [TP_ID.closecrm]: 'firstName',
            },
            target_field_name: 'firstName',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'lastname',
                [TP_ID.pipedrive]: undefined, // firstName (title) includes full name
                [TP_ID.sfdc]: 'LastName',
                [TP_ID.zohocrm]: 'Last_Name',
                [TP_ID.closecrm]: 'lastName',
            },
            target_field_name: 'lastName',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'phone',
                [TP_ID.pipedrive]: 'person.phone.0.value',
                [TP_ID.sfdc]: 'Phone',
                [TP_ID.zohocrm]: 'Phone',
                [TP_ID.closecrm]: 'contacts.0.phones.0.phone',
            },
            target_field_name: 'phone',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'email',
                [TP_ID.pipedrive]: 'person.email.0.value',
                [TP_ID.sfdc]: 'Email',
                [TP_ID.zohocrm]: 'Email',
                [TP_ID.closecrm]: 'contacts.0.emails.0.email',
            },
            target_field_name: 'email',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'id',
                [TP_ID.pipedrive]: 'id',
                [TP_ID.sfdc]: 'Id',
                [TP_ID.zohocrm]: 'id',
                [TP_ID.closecrm]: 'id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'id',
                [TP_ID.pipedrive]: 'id',
                [TP_ID.sfdc]: 'Id',
                [TP_ID.zohocrm]: 'id',
                [TP_ID.closecrm]: 'id',
            },
            target_field_name: 'remoteId',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_createdate',
                [TP_ID.pipedrive]: 'add_time',
                [TP_ID.sfdc]: 'CreatedDate',
                [TP_ID.zohocrm]: 'Created_Time',
                [TP_ID.closecrm]: 'date_created',
            },
            target_field_name: 'createdTimestamp',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_lastmodifieddate',
                [TP_ID.pipedrive]: 'update_time',
                [TP_ID.sfdc]: 'LastModifiedDate',
                [TP_ID.zohocrm]: 'Modified_Time',
                [TP_ID.closecrm]: 'date_updated',
            },
            target_field_name: 'updatedTimestamp',
        },
    ],
    [StandardObjects.task]: [
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_task_subject',
                [TP_ID.pipedrive]: 'subject',
                [TP_ID.sfdc]: 'Subject',
                [TP_ID.zohocrm]: 'Subject',
                [TP_ID.closecrm]: 'text',
            },
            target_field_name: 'subject',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_task_body',
                [TP_ID.pipedrive]: 'public_description',
                [TP_ID.sfdc]: 'Description',
                [TP_ID.zohocrm]: 'Description',
                [TP_ID.closecrm]: undefined, // no description only text field available
            },
            target_field_name: 'body',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_task_priority',
                [TP_ID.pipedrive]: undefined,
                [TP_ID.sfdc]: 'Priority',
                [TP_ID.zohocrm]: 'Priority',
                [TP_ID.closecrm]: undefined,
            },
            target_field_name: 'priority',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_task_status',
                [TP_ID.pipedrive]: 'status',
                [TP_ID.sfdc]: 'Status',
                [TP_ID.zohocrm]: 'Status',
                [TP_ID.closecrm]: 'is_complete',
            },
            target_field_name: 'status',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_timestamp',
                [TP_ID.pipedrive]: 'due_date',
                [TP_ID.sfdc]: 'ActivityDate',
                [TP_ID.zohocrm]: 'Due_Date',
                [TP_ID.closecrm]: 'date',
            },
            target_field_name: 'dueDate',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'id',
                [TP_ID.pipedrive]: 'id',
                [TP_ID.sfdc]: 'Id',
                [TP_ID.zohocrm]: 'id',
                [TP_ID.closecrm]: 'id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'id',
                [TP_ID.pipedrive]: 'id',
                [TP_ID.sfdc]: 'Id',
                [TP_ID.zohocrm]: 'id',
                [TP_ID.closecrm]: 'id',
            },
            target_field_name: 'remoteId',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_createdate',
                [TP_ID.pipedrive]: 'add_time',
                [TP_ID.sfdc]: 'CreatedDate',
                [TP_ID.zohocrm]: 'Created_Time',
                [TP_ID.closecrm]: 'date_created',
            },
            target_field_name: 'createdTimestamp',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_lastmodifieddate',
                [TP_ID.pipedrive]: 'update_time',
                [TP_ID.sfdc]: 'LastModifiedDate',
                [TP_ID.zohocrm]: 'Modified_Time',
                [TP_ID.closecrm]: 'date_updated',
            },
            target_field_name: 'updatedTimestamp',
        },
    ],
    [StandardObjects.user]: [
        {
            source_field_name: {
                [TP_ID.hubspot]: 'firstname',
                [TP_ID.pipedrive]: 'name',
                [TP_ID.sfdc]: 'FirstName',
                [TP_ID.zohocrm]: 'first_name',
                [TP_ID.closecrm]: 'first_name',
            },
            target_field_name: 'firstName',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'lastname',
                [TP_ID.pipedrive]: undefined,
                [TP_ID.sfdc]: 'LastName',
                [TP_ID.zohocrm]: 'last_name',
                [TP_ID.closecrm]: 'last_name',
            },
            target_field_name: 'lastName',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'phone',
                [TP_ID.pipedrive]: 'phone',
                [TP_ID.sfdc]: 'Phone',
                [TP_ID.zohocrm]: 'phone',
                [TP_ID.closecrm]: undefined,
            },
            target_field_name: 'phone',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'email',
                [TP_ID.pipedrive]: 'email',
                [TP_ID.sfdc]: 'Email',
                [TP_ID.zohocrm]: 'email',
                [TP_ID.closecrm]: 'email',
            },
            target_field_name: 'email',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'id',
                [TP_ID.pipedrive]: 'id',
                [TP_ID.sfdc]: 'Id',
                [TP_ID.zohocrm]: 'id',
                [TP_ID.closecrm]: 'id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'id',
                [TP_ID.pipedrive]: 'id',
                [TP_ID.sfdc]: 'Id',
                [TP_ID.zohocrm]: 'id',
                [TP_ID.closecrm]: 'id',
            },
            target_field_name: 'remoteId',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_createdate',
                [TP_ID.pipedrive]: 'add_time',
                [TP_ID.sfdc]: 'CreatedDate',
                [TP_ID.zohocrm]: 'Created_Time',
                [TP_ID.closecrm]: 'date_created',
            },
            target_field_name: 'createdTimestamp',
        },
        {
            source_field_name: {
                [TP_ID.hubspot]: 'hs_lastmodifieddate',
                [TP_ID.pipedrive]: 'update_time',
                [TP_ID.sfdc]: 'LastModifiedDate',
                [TP_ID.zohocrm]: 'Modified_Time',
                [TP_ID.closecrm]: 'date_updated',
            },
            target_field_name: 'updatedTimestamp',
        },
    ],
};

export const chatFields = {
    [ChatStandardObjects.channel]: [
        {
            source_field_name: {
                [TP_ID.slack]: 'id',
                [TP_ID.discord]: 'id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.slack]: 'name',
                [TP_ID.discord]: 'name',
            },
            target_field_name: 'name',
        },
        {
            source_field_name: {
                [TP_ID.slack]: 'created',
                [TP_ID.discord]: undefined,
            },
            target_field_name: 'createdTimeStamp',
        },
    ],
    [ChatStandardObjects.chatUser]: [
        {
            source_field_name: {
                [TP_ID.slack]: 'id',
                [TP_ID.discord]: 'user.id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.slack]: 'profile.real_name',
                [TP_ID.discord]: 'user.global_name',
            },
            target_field_name: 'name',
        },
        {
            source_field_name: {
                [TP_ID.slack]: 'updated',
                [TP_ID.discord]: 'joined_at',
            },
            target_field_name: 'createdTimeStamp',
        },
    ],
    [ChatStandardObjects.message]: [
        {
            source_field_name: {
                [TP_ID.slack]: 'text',
                [TP_ID.discord]: 'content',
            },
            target_field_name: 'text',
        },
        {
            source_field_name: {
                [TP_ID.slack]: 'channel',
                [TP_ID.discord]: undefined,
            },
            target_field_name: 'channelId',
        },
    ],
};

export const ticketingFields = {
    [TicketStandardObjects.ticketTask]: [
        {
            source_field_name: {
                [TP_ID.linear]: 'id',
                [TP_ID.clickup]: 'id',
                [TP_ID.jira]: 'id',
                [TP_ID.trello]: 'id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'id',
                [TP_ID.clickup]: 'id',
                [TP_ID.jira]: 'id',
                [TP_ID.trello]: 'id',
            },
            target_field_name: 'remoteId',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'title',
                [TP_ID.clickup]: 'name',
                [TP_ID.jira]: 'summary',
                [TP_ID.trello]: 'name',
            },
            target_field_name: 'name',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'assignee',
                [TP_ID.clickup]: 'assignees',
                [TP_ID.jira]: 'assignee',
                [TP_ID.trello]: 'idMembers',
            },
            target_field_name: 'assignees',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'description',
                [TP_ID.clickup]: 'description',
                [TP_ID.jira]: 'description',
                [TP_ID.trello]: 'desc',
            },
            target_field_name: 'description',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'state',
                [TP_ID.clickup]: 'status',
                [TP_ID.jira]: 'status.name',
                [TP_ID.trello]: undefined,
            },
            target_field_name: 'status',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'priorityLabel',
                [TP_ID.clickup]: 'priority',
                [TP_ID.jira]: 'priority.name',
                [TP_ID.trello]: undefined,
            },
            target_field_name: 'priority',
        },
        {
            source_field_name: {
                [TP_ID.linear]: '_creator.id',
                [TP_ID.clickup]: 'creator.id',
                [TP_ID.jira]: 'creator.accountId',
                [TP_ID.trello]: undefined,
            },
            target_field_name: 'creatorId',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'createdAt',
                [TP_ID.clickup]: 'date_created',
                [TP_ID.jira]: 'created',
                [TP_ID.trello]: undefined,
            },
            target_field_name: 'createdTimeStamp',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'updatedAt',
                [TP_ID.clickup]: 'date_updated',
                [TP_ID.jira]: 'updated',
                [TP_ID.trello]: 'dateLastActivity',
            },
            target_field_name: 'updatedTimeStamp',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'dueDate',
                [TP_ID.clickup]: 'due_date',
                [TP_ID.jira]: 'duedate',
                [TP_ID.trello]: 'due',
            },
            target_field_name: 'dueDate',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'completedDate',
                [TP_ID.clickup]: 'date_done',
                [TP_ID.jira]: undefined,
                [TP_ID.trello]: undefined,
            },
            target_field_name: 'completedDate',
        },
        {
            source_field_name: {
                [TP_ID.linear]: '_parent.id',
                [TP_ID.clickup]: 'parent',
                [TP_ID.jira]: 'parent.id',
                [TP_ID.trello]: undefined,
            },
            target_field_name: 'parentId',
        },
        {
            source_field_name: {
                [TP_ID.jira]: 'project.id',
            },
            target_field_name: 'projectId',
        },
        {
            source_field_name: {
                [TP_ID.jira]: 'issuetype.id',
            },
            target_field_name: 'issueTypeId',
        },
    ],
    [TicketStandardObjects.ticketUser]: [
        {
            source_field_name: {
                [TP_ID.linear]: 'id',
                [TP_ID.clickup]: 'id',
                [TP_ID.jira]: 'accountId',
                [TP_ID.trello]: 'id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'id',
                [TP_ID.clickup]: 'id',
                [TP_ID.jira]: 'accountId',
                [TP_ID.trello]: 'id',
            },
            target_field_name: 'remoteId',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'email',
                [TP_ID.clickup]: 'email',
                [TP_ID.jira]: 'emailAddress',
                [TP_ID.trello]: 'email',
            },
            target_field_name: 'email',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'name',
                [TP_ID.clickup]: 'username',
                [TP_ID.jira]: 'displayName',
                [TP_ID.trello]: 'fullName',
            },
            target_field_name: 'name',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'active',
                [TP_ID.clickup]: undefined,
                [TP_ID.jira]: 'active',
                [TP_ID.trello]: undefined,
            },
            target_field_name: 'isActive',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'avatarUrl',
                [TP_ID.clickup]: 'profilePicture',
                [TP_ID.jira]: 'avatarUrls."48x48"',
                [TP_ID.trello]: 'avatarUrl',
            },
            target_field_name: 'avatar',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'createdAt',
                [TP_ID.clickup]: undefined,
                [TP_ID.jira]: undefined,
                [TP_ID.trello]: undefined,
            },
            target_field_name: 'createdTimeStamp',
        },
        {
            source_field_name: {
                [TP_ID.linear]: null,
                [TP_ID.clickup]: undefined,
                [TP_ID.jira]: undefined,
                [TP_ID.trello]: undefined,
            },
            target_field_name: 'updatedTimeStamp',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'admin',
                [TP_ID.clickup]: undefined,
                [TP_ID.jira]: undefined,
                [TP_ID.trello]: undefined,
            },
            target_field_name: 'isAdmin',
        },
    ],
    [TicketStandardObjects.ticketComment]: [
        {
            source_field_name: {
                [TP_ID.linear]: 'id',
                [TP_ID.clickup]: 'id',
                [TP_ID.jira]: 'id',
                [TP_ID.trello]: 'id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'id',
                [TP_ID.clickup]: 'id',
                [TP_ID.jira]: 'id',
                [TP_ID.trello]: 'id',
            },
            target_field_name: 'remoteId',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'body',
                [TP_ID.clickup]: 'comment_text',
                [TP_ID.jira]: 'body',
                [TP_ID.trello]: 'data.text',
            },
            target_field_name: 'body',
        },
        {
            source_field_name: {
                [TP_ID.linear]: '_user.id',
                [TP_ID.clickup]: 'user.id',
                [TP_ID.jira]: 'author.accountId',
                [TP_ID.trello]: 'idMemberCreator',
            },
            target_field_name: 'createdBy',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'createdAt',
                [TP_ID.clickup]: 'date',
                [TP_ID.jira]: 'created',
                [TP_ID.trello]: 'date',
            },
            target_field_name: 'createdTimestamp',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'updatedAt',
                [TP_ID.clickup]: undefined,
                [TP_ID.jira]: 'updated',
                [TP_ID.trello]: 'data.dateLastEdited',
            },
            target_field_name: 'updatedTimeStamp',
        },
        {
            source_field_name: {
                [TP_ID.linear]: '_parent.id',
                [TP_ID.clickup]: undefined,
                [TP_ID.jira]: undefined,
                [TP_ID.trello]: undefined,
            },
            target_field_name: 'parentId',
        },
    ],
};
