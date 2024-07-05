import { TP_ID } from '@prisma/client';
import { AtsStandardObjects, ChatStandardObjects, StandardObjects, TicketStandardObjects } from '../constants/common';

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
                [TP_ID.ms_dynamics_365_sales]: 'notetext',
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
                [TP_ID.ms_dynamics_365_sales]: 'annotationid',
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
                [TP_ID.ms_dynamics_365_sales]: 'annotationid',
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
                [TP_ID.ms_dynamics_365_sales]: 'createdon',
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
                [TP_ID.ms_dynamics_365_sales]: 'modifiedon',
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
                [TP_ID.ms_dynamics_365_sales]: 'firstname',
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
                [TP_ID.ms_dynamics_365_sales]: 'lastname',
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
                [TP_ID.ms_dynamics_365_sales]: 'mobilephone',
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
                [TP_ID.ms_dynamics_365_sales]: 'emailaddress1',
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
                [TP_ID.ms_dynamics_365_sales]: 'contactid',
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
                [TP_ID.ms_dynamics_365_sales]: 'contactid',
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
                [TP_ID.ms_dynamics_365_sales]: 'createdon',
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
                [TP_ID.ms_dynamics_365_sales]: 'modifiedon',
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
                [TP_ID.ms_dynamics_365_sales]: 'name',
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
                [TP_ID.ms_dynamics_365_sales]: 'industrycode',
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
                [TP_ID.ms_dynamics_365_sales]: 'description',
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
                [TP_ID.ms_dynamics_365_sales]: 'revenue',
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
                [TP_ID.ms_dynamics_365_sales]: 'numberofemployees',
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
                [TP_ID.ms_dynamics_365_sales]: 'telephone1',
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
                [TP_ID.ms_dynamics_365_sales]: 'address_street', // address_street = address1_line1 + address1_line2 + address1_line3 in preprocessing
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
                [TP_ID.ms_dynamics_365_sales]: 'address1_city',
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
                [TP_ID.ms_dynamics_365_sales]: 'address1_stateorprovince',
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
                [TP_ID.ms_dynamics_365_sales]: 'address1_country',
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
                [TP_ID.ms_dynamics_365_sales]: 'address1_postalcode',
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
                [TP_ID.ms_dynamics_365_sales]: 'address1_postalcode',
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
                [TP_ID.ms_dynamics_365_sales]: 'accountid',
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
                [TP_ID.ms_dynamics_365_sales]: 'accountid',
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
                [TP_ID.ms_dynamics_365_sales]: 'createdon',
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
                [TP_ID.ms_dynamics_365_sales]: 'modifiedon',
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
                [TP_ID.ms_dynamics_365_sales]: 'estimatedvalue',
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
                [TP_ID.ms_dynamics_365_sales]: 'opportunityratingcode',
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
                [TP_ID.ms_dynamics_365_sales]: 'salesstagecode',
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
                [TP_ID.ms_dynamics_365_sales]: 'name',
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
                [TP_ID.ms_dynamics_365_sales]: 'estimatedclosedate',
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
                [TP_ID.ms_dynamics_365_sales]: 'statecode', //statecode===1
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
                [TP_ID.ms_dynamics_365_sales]: 'closeprobability',
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
                [TP_ID.ms_dynamics_365_sales]: 'opportunityid',
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
                [TP_ID.ms_dynamics_365_sales]: 'opportunityid',
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
                [TP_ID.ms_dynamics_365_sales]: 'createdon',
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
                [TP_ID.ms_dynamics_365_sales]: 'modifiedon',
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
                [TP_ID.ms_dynamics_365_sales]: 'activitytypecode',
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
                [TP_ID.ms_dynamics_365_sales]: 'subject',
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
                [TP_ID.ms_dynamics_365_sales]: 'scheduledstart',
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
                [TP_ID.ms_dynamics_365_sales]: 'scheduledend',
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
                [TP_ID.ms_dynamics_365_sales]: 'isalldayevent',
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
                [TP_ID.ms_dynamics_365_sales]: 'description',
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
                [TP_ID.ms_dynamics_365_sales]: 'location',
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
                [TP_ID.ms_dynamics_365_sales]: 'activityid',
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
                [TP_ID.ms_dynamics_365_sales]: 'activityid',
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
                [TP_ID.ms_dynamics_365_sales]: 'createdon',
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
                [TP_ID.ms_dynamics_365_sales]: 'modifiedon',
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
                [TP_ID.ms_dynamics_365_sales]: 'firstname',
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
                [TP_ID.ms_dynamics_365_sales]: 'lastname',
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
                [TP_ID.ms_dynamics_365_sales]: 'mobilephone',
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
                [TP_ID.ms_dynamics_365_sales]: 'emailaddress1',
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
                [TP_ID.ms_dynamics_365_sales]: 'leadid',
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
                [TP_ID.ms_dynamics_365_sales]: 'leadid',
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
                [TP_ID.ms_dynamics_365_sales]: 'createdon',
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
                [TP_ID.ms_dynamics_365_sales]: 'modifiedon',
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
                [TP_ID.ms_dynamics_365_sales]: 'subject',
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
                [TP_ID.ms_dynamics_365_sales]: 'description',
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
                [TP_ID.ms_dynamics_365_sales]: 'priority', // prioritycode field will be preprocessed to priority
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
                [TP_ID.ms_dynamics_365_sales]: 'status', // statecode field will be preprocessed to status
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
                [TP_ID.ms_dynamics_365_sales]: 'scheduledend',
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
                [TP_ID.ms_dynamics_365_sales]: 'activityid',
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
                [TP_ID.ms_dynamics_365_sales]: 'activityid',
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
                [TP_ID.ms_dynamics_365_sales]: 'createdon',
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
                [TP_ID.ms_dynamics_365_sales]: 'modifiedon',
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
                [TP_ID.ms_dynamics_365_sales]: 'firstname',
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
                [TP_ID.ms_dynamics_365_sales]: 'lastname',
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
                [TP_ID.ms_dynamics_365_sales]: 'mobilephone',
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
                [TP_ID.ms_dynamics_365_sales]: 'internalemailaddress', // this is Primary email address
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
                [TP_ID.ms_dynamics_365_sales]: 'ownerid',
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
                [TP_ID.ms_dynamics_365_sales]: 'ownerid',
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
                [TP_ID.ms_dynamics_365_sales]: 'createdon',
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
                [TP_ID.ms_dynamics_365_sales]: 'modifiedon',
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
                [TP_ID.bitbucket]: 'id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'id',
                [TP_ID.clickup]: 'id',
                [TP_ID.jira]: 'id',
                [TP_ID.trello]: 'id',
                [TP_ID.bitbucket]: 'id',
            },
            target_field_name: 'remoteId',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'title',
                [TP_ID.clickup]: 'name',
                [TP_ID.jira]: 'summary',
                [TP_ID.trello]: 'name',
                [TP_ID.bitbucket]: 'title',
            },
            target_field_name: 'name',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'assignee',
                [TP_ID.clickup]: 'assignees',
                [TP_ID.jira]: 'assignee',
                [TP_ID.trello]: 'idMembers',
                [TP_ID.bitbucket]: 'assignee',
            },
            target_field_name: 'assignees',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'description',
                [TP_ID.clickup]: 'description',
                [TP_ID.jira]: 'description',
                [TP_ID.trello]: 'desc',
                [TP_ID.bitbucket]: 'content.raw',
            },
            target_field_name: 'description',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'state',
                [TP_ID.clickup]: 'status',
                [TP_ID.jira]: 'status.name',
                [TP_ID.trello]: undefined,
                [TP_ID.bitbucket]: 'state',
            },
            target_field_name: 'status',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'priorityLabel',
                [TP_ID.clickup]: 'priority',
                [TP_ID.jira]: 'priority.name',
                [TP_ID.trello]: undefined,
                [TP_ID.bitbucket]: 'priority',
            },
            target_field_name: 'priority',
        },
        {
            source_field_name: {
                [TP_ID.linear]: '_creator.id',
                [TP_ID.clickup]: 'creator.id',
                [TP_ID.jira]: 'creator.accountId',
                [TP_ID.trello]: undefined,
                [TP_ID.bitbucket]: 'reporter.account_id',
            },
            target_field_name: 'creatorId',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'createdAt',
                [TP_ID.clickup]: 'date_created',
                [TP_ID.jira]: 'created',
                [TP_ID.trello]: undefined,
                [TP_ID.bitbucket]: 'created_on',
            },
            target_field_name: 'createdTimeStamp',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'updatedAt',
                [TP_ID.clickup]: 'date_updated',
                [TP_ID.jira]: 'updated',
                [TP_ID.trello]: 'dateLastActivity',
                [TP_ID.bitbucket]: 'updated_on',
            },
            target_field_name: 'updatedTimeStamp',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'dueDate',
                [TP_ID.clickup]: 'due_date',
                [TP_ID.jira]: 'duedate',
                [TP_ID.trello]: 'due',
                [TP_ID.bitbucket]: undefined,
            },
            target_field_name: 'dueDate',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'completedDate',
                [TP_ID.clickup]: 'date_done',
                [TP_ID.jira]: undefined,
                [TP_ID.trello]: undefined,
                [TP_ID.bitbucket]: undefined,
            },
            target_field_name: 'completedDate',
        },
        {
            source_field_name: {
                [TP_ID.linear]: '_parent.id',
                [TP_ID.clickup]: 'parent',
                [TP_ID.jira]: 'parent.id',
                [TP_ID.trello]: undefined,
                [TP_ID.bitbucket]: undefined,
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
                [TP_ID.bitbucket]: 'kind',
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
                [TP_ID.bitbucket]: 'account_id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'id',
                [TP_ID.clickup]: 'id',
                [TP_ID.jira]: 'accountId',
                [TP_ID.trello]: 'id',
                [TP_ID.bitbucket]: 'account_id',
            },
            target_field_name: 'remoteId',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'email',
                [TP_ID.clickup]: 'email',
                [TP_ID.jira]: 'emailAddress',
                [TP_ID.trello]: 'email',
                [TP_ID.bitbucket]: undefined,
            },
            target_field_name: 'email',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'name',
                [TP_ID.clickup]: 'username',
                [TP_ID.jira]: 'displayName',
                [TP_ID.trello]: 'fullName',
                [TP_ID.bitbucket]: 'display_name',
            },
            target_field_name: 'name',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'active',
                [TP_ID.clickup]: undefined,
                [TP_ID.jira]: 'active',
                [TP_ID.trello]: undefined,
                [TP_ID.bitbucket]: 'account_status',
            },
            target_field_name: 'isActive',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'avatarUrl',
                [TP_ID.clickup]: 'profilePicture',
                [TP_ID.jira]: 'avatarUrls."48x48"',
                [TP_ID.trello]: 'avatarUrl',
                [TP_ID.bitbucket]: 'links.avatar',
            },
            target_field_name: 'avatar',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'createdAt',
                [TP_ID.clickup]: undefined,
                [TP_ID.jira]: undefined,
                [TP_ID.trello]: undefined,
                [TP_ID.bitbucket]: 'created_on',
            },
            target_field_name: 'createdTimeStamp',
        },
        {
            source_field_name: {
                [TP_ID.linear]: null,
                [TP_ID.clickup]: undefined,
                [TP_ID.jira]: undefined,
                [TP_ID.trello]: undefined,
                [TP_ID.bitbucket]: undefined,
            },
            target_field_name: 'updatedTimeStamp',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'admin',
                [TP_ID.clickup]: undefined,
                [TP_ID.jira]: undefined,
                [TP_ID.trello]: undefined,
                [TP_ID.bitbucket]: 'is_staff',
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
                [TP_ID.bitbucket]: 'id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'id',
                [TP_ID.clickup]: 'id',
                [TP_ID.jira]: 'id',
                [TP_ID.trello]: 'id',
                [TP_ID.bitbucket]: 'id',
            },
            target_field_name: 'remoteId',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'body',
                [TP_ID.clickup]: 'comment_text',
                [TP_ID.jira]: 'body',
                [TP_ID.trello]: 'data.text',
                [TP_ID.bitbucket]: 'content.raw',
            },
            target_field_name: 'body',
        },
        {
            source_field_name: {
                [TP_ID.linear]: '_user.id',
                [TP_ID.clickup]: 'user.id',
                [TP_ID.jira]: 'author.accountId',
                [TP_ID.trello]: 'idMemberCreator',
                [TP_ID.bitbucket]: 'user.account_id',
            },
            target_field_name: 'createdBy',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'createdAt',
                [TP_ID.clickup]: 'date',
                [TP_ID.jira]: 'created',
                [TP_ID.trello]: 'date',
                [TP_ID.bitbucket]: 'created_on',
            },
            target_field_name: 'createdTimestamp',
        },
        {
            source_field_name: {
                [TP_ID.linear]: 'updatedAt',
                [TP_ID.clickup]: undefined,
                [TP_ID.jira]: 'updated',
                [TP_ID.trello]: 'data.dateLastEdited',
                [TP_ID.bitbucket]: 'updated_on',
            },
            target_field_name: 'updatedTimeStamp',
        },
        {
            source_field_name: {
                [TP_ID.linear]: '_parent.id',
                [TP_ID.clickup]: undefined,
                [TP_ID.jira]: undefined,
                [TP_ID.trello]: undefined,
                [TP_ID.bitbucket]: undefined,
            },
            target_field_name: 'parentId',
        },
    ],
};

export const atsFields = {
    [AtsStandardObjects.candidate]: [
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'id',
                [TP_ID.lever]: 'id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'first_name',
                [TP_ID.lever]: 'name',
            },
            target_field_name: 'first_name',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'last_name',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'last_name',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'company',
                [TP_ID.lever]: 'headline',
            },
            target_field_name: 'company',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'title',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'title',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'created_at',
                [TP_ID.lever]: 'createdAt',
            },
            target_field_name: 'created_at',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'updated_at',
                [TP_ID.lever]: 'updatedAt',
            },
            target_field_name: 'updated_at',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'last_activity',
                [TP_ID.lever]: 'lastInteractionAt',
            },
            target_field_name: 'last_activity',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'is_private',
                [TP_ID.lever]: 'confidentiality',
            },
            target_field_name: 'is_private',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'photo_url',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'photo_url',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'application_ids',
                [TP_ID.lever]: 'applicationIds',
            },
            target_field_name: 'application_ids',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'can_email',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'can_email',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'tags',
                [TP_ID.lever]: 'tags',
            },
            target_field_name: 'tags',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'attachments',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'attachments',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'phone_numbers',
                [TP_ID.lever]: 'phones',
            },
            target_field_name: 'phone_numbers',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'addresses',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'addresses',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'email_addresses',
                [TP_ID.lever]: 'emails',
            },
            target_field_name: 'email_addresses',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'website_addresses',
                [TP_ID.lever]: 'links',
            },
            target_field_name: 'website_addresses',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'social_media_addresses',
                [TP_ID.lever]: 'links',
            },
            target_field_name: 'social_media_addresses',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'recruiter.id',
                [TP_ID.lever]: 'owner.id',
            },
            target_field_name: 'recruiter.id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'recruiter.first_name',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'recruiter.first_name',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'recruiter.last_name',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'recruiter.last_name',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'recruiter.name',
                [TP_ID.lever]: 'owner.name',
            },
            target_field_name: 'recruiter.name',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'recruiter.employee_id',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'recruiter.employee_id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'recruiter.responsible',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'recruiter.responsible',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'coordinator.id',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'coordinator.id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'coordinator.first_name',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'coordinator.first_name',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'coordinator.last_name',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'coordinator.last_name',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'coordinator.name',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'coordinator.name',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'coordinator.employee_id',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'coordinator.employee_id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'coordinator.responsible',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'coordinator.responsible',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'applications',
                [TP_ID.lever]: 'applications',
            },
            target_field_name: 'applications',
        },
    ],

    [AtsStandardObjects.job]: [
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'id',
                [TP_ID.lever]: 'id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'name',
                [TP_ID.lever]: 'text',
            },
            target_field_name: 'name',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'requisition_id',
                [TP_ID.lever]: 'reqCode',
            },
            target_field_name: 'requisition_id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'notes',
                [TP_ID.lever]: 'content.description',
            },
            target_field_name: 'notes',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'confidential',
                [TP_ID.lever]: 'confidentiality',
            },
            target_field_name: 'confidential',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'status',
                [TP_ID.lever]: 'state',
            },
            target_field_name: 'status',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'created_at',
                [TP_ID.lever]: 'createdAt',
            },
            target_field_name: 'created_at',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'opened_at',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'opened_at',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'closed_at',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'closed_at',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'updated_at',
                [TP_ID.lever]: 'updatedAt',
            },
            target_field_name: 'updated_at',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'is_template',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'is_template',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'copied_from_id',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'copied_from_id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'departments',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'departments',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'offices',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'offices',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'openings',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'openings',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'hiring_team.hiring_managers',
                [TP_ID.lever]: 'hiringManager',
            },
            target_field_name: 'hiring_team.hiring_managers',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'hiring_team.recruiters',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'hiring_team.recruiters',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'hiring_team.coordinators',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'hiring_team.coordinators',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'hiring_team.sourcers',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'hiring_team.sourcers',
        },
    ],

    [AtsStandardObjects.offer]: [
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'id',
                [TP_ID.lever]: 'id',
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'version',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'version',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'application_id',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'application_id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'job_id',
                [TP_ID.lever]: 'posting_id',
            },
            target_field_name: 'job_id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'candidate_id',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'candidate_id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'opening.id',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'opening.id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'opening.opening_id',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'opening.opening_id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'opening.status',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'opening.status',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'opening.opened_at',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'opening.opened_at',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'opening.closed_at',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'opening.closed_at',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'opening.application_id',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'opening.application_id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'opening.close_reason.id',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'opening.close_reason.id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'opening.close_reason.name',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'opening.close_reason.name',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'created_at',
                [TP_ID.lever]: 'createdAt',
            },
            target_field_name: 'created_at',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'updated_at',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'updated_at',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'sent_at',
                [TP_ID.lever]: 'sentAt',
            },
            target_field_name: 'sent_at',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'resolved_at',
                [TP_ID.lever]: 'approvedAt',
            },
            target_field_name: 'resolved_at',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'starts_at',
                [TP_ID.lever]: 'startsAt',
            },
            target_field_name: 'starts_at',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'status',
                [TP_ID.lever]: 'status',
            },
            target_field_name: 'status',
        },
    ],

    [AtsStandardObjects.department]: [
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'id',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'name',
                [TP_ID.lever]: 'name',
            },
            target_field_name: 'name',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'parent_id',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'parent_id',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'parent_department_external_ids',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'parent_department_external_ids',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'child_ids',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'child_ids',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'child_department_external_ids',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'child_department_external_ids',
        },
        {
            source_field_name: {
                [TP_ID.greenhouse]: 'external_id',
                [TP_ID.lever]: undefined,
            },
            target_field_name: 'external_id',
        },
    ],
};
