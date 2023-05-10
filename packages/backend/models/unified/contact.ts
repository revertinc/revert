export interface UnifiedContact {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    id: string;
    remoteId: string; // TODO: Make this unique.
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: any; // TODO: Support associations
    additional: any;
}

export function unifyContact(contact: any): UnifiedContact {
    const unifiedContact: UnifiedContact = {
        remoteId: contact.id || contact.ContactID || contact.contact_id || contact.Id,
        id: contact.id || contact.ContactID || contact.contact_id || contact.Id,
        firstName: contact.firstName || contact.firstname || contact.FirstName || contact.First_Name,
        lastName: contact.lastName || contact.lastname || contact.LastName || contact.Last_Name,
        phone: contact.phone || contact.phone_number || contact.Phone,
        email: contact.email || contact.Email,
        createdTimestamp:
            contact.createdDate ||
            contact.CreatedDate ||
            contact.Created_Time ||
            contact.hs_timestamp ||
            contact.createdate,
        updatedTimestamp:
            contact.lastModifiedDate || contact.LastModifiedDate || contact.Modified_Time || contact.lastmodifieddate,
        additional: {},
    };

    // Map additional fields
    Object.keys(contact).forEach((key) => {
        if (!(key in unifiedContact)) {
            unifiedContact['additional'][key] = contact[key];
        }
    });

    return unifiedContact;
}

export interface HubspotContact {
    company_size: string;
    date_of_birth: string;
    degree: string;
    field_of_study: string;
    first_deal_created_date: Date;
    gender: string;
    graduation_date: string;
    hs_all_assigned_business_unit_ids: number;
    hs_analytics_first_touch_converting_campaign: string;
    hs_analytics_last_touch_converting_campaign: string;
    hs_avatar_filemanager_key: string;
    hs_buying_role: number;
    hs_clicked_linkedin_ad: number;
    hs_content_membership_email: string;
    hs_content_membership_email_confirmed: boolean;
    hs_content_membership_follow_up_enqueued_at: Date;
    hs_content_membership_notes: string;
    hs_content_membership_registered_at: Date;
    hs_content_membership_registration_domain_sent_to: string;
    hs_content_membership_registration_email_sent_at: Date;
    hs_content_membership_status: number;
    hs_conversations_visitor_email: string;
    hs_count_is_unworked: number;
    hs_count_is_worked: number;
    hs_created_by_conversations: boolean;
    hs_created_by_user_id: number;
    hs_createdate: Date;
    hs_date_entered_customer: Date;
    hs_date_entered_evangelist: Date;
    hs_date_entered_lead: Date;
    hs_date_entered_marketingqualifiedlead: Date;
    hs_date_entered_opportunity: Date;
    hs_date_entered_other: Date;
    hs_date_entered_salesqualifiedlead: Date;
    hs_date_entered_subscriber: Date;
    hs_date_exited_customer: Date;
    hs_date_exited_evangelist: Date;
    hs_date_exited_lead: Date;
    hs_date_exited_marketingqualifiedlead: Date;
    hs_date_exited_opportunity: Date;
    hs_date_exited_other: Date;
    hs_date_exited_salesqualifiedlead: Date;
    hs_date_exited_subscriber: Date;
    hs_document_last_revisited: Date;
    hs_email_bad_address: boolean;
    hs_email_customer_quarantined_reason: number;
    hs_email_hard_bounce_reason: string;
    hs_email_hard_bounce_reason_number: number;
    hs_email_quarantined: boolean;
    hs_email_quarantined_reason: number;
    hs_email_recipient_fatigue_recovery_time: Date;
    hs_email_sends_since_last_engagement: number;
    hs_emailconfirmationstatus: number;
    hs_facebook_ad_clicked: boolean;
    hs_facebook_click_id: string;
    hs_facebookid: string;
    hs_feedback_last_nps_follow_up: string;
    hs_feedback_last_nps_rating: number;
    hs_feedback_last_survey_date: Date;
    hs_feedback_show_nps_web_survey: boolean;
    hs_first_subscription_create_date: Date;
    hs_google_click_id: string;
    hs_googleplusid: string;
    hs_has_active_subscription: number;
    hs_ip_timezone: string;
    hs_is_unworked: boolean;
    hs_last_sales_activity_date: Date;
    hs_last_sales_activity_timestamp: Date;
    hs_last_sales_activity_type: number;
    hs_lastmodifieddate: Date;
    hs_latest_sequence_enrolled: number;
    hs_latest_sequence_enrolled_date: Date;
    hs_latest_sequence_finished_date: Date;
    hs_latest_sequence_unenrolled_date: Date;
    hs_latest_source_timestamp: Date;
    hs_latest_subscription_create_date: Date;
    hs_lead_status: number;
    hs_legal_basis: number;
    hs_linkedin_ad_clicked: number;
    hs_linkedinid: string;
    hs_marketable_reason_id: string;
    hs_marketable_reason_type: number;
    hs_marketable_status: number;
    hs_marketable_until_renewal: number;
    hs_merged_object_ids: number;
    hs_object_id: number;
    hs_pinned_engagement_id: number;
    hs_pipeline: number;
    hs_predictivecontactscore_v2: number;
    hs_predictivescoringtier: number;
    hs_read_only: boolean;
    hs_sa_first_engagement_date: Date;
    hs_sales_email_last_clicked: Date;
    hs_sales_email_last_opened: Date;
    hs_sequences_actively_enrolled_count: number;
    hs_sequences_enrolled_count: number;
    hs_testpurge: string;
    hs_testrollback: string;
    hs_time_between_contact_creation_and_deal_close: number;
    hs_time_between_contact_creation_and_deal_creation: number;
    hs_time_in_customer: number;
    hs_time_in_evangelist: number;
    hs_time_in_lead: number;
    hs_time_in_marketingqualifiedlead: number;
    hs_time_in_opportunity: number;
    hs_time_in_other: number;
    hs_time_in_salesqualifiedlead: number;
    hs_time_in_subscriber: number;
    hs_time_to_move_from_lead_to_customer: number;
    hs_time_to_move_from_marketingqualifiedlead_to_customer: number;
    hs_time_to_move_from_opportunity_to_customer: number;
    hs_time_to_move_from_salesqualifiedlead_to_customer: number;
    hs_time_to_move_from_subscriber_to_customer: number;
    hs_timezone: number;
    hs_twitterid: string;
    hs_unique_creation_key: string;
    hs_updated_by_user_id: number;
    hs_user_ids_of_all_notification_followers: number;
    hs_user_ids_of_all_notification_unfollowers: number;
    hs_user_ids_of_all_owners: number;
    hs_whatsapp_phone_number: string;
    hubspot_owner_assigneddate: Date;
    ip_city: string;
    ip_country: string;
    ip_country_code: string;
    ip_latlon: string;
    ip_state: string;
    ip_state_code: string;
    ip_zipcode: string;
    job_function: string;
    lastmodifieddate: Date;
    marital_status: string;
    military_status: string;
    num_associated_deals: number;
    recent_deal_amount: number;
    recent_deal_close_date: Date;
    relationship_status: string;
    school: string;
    seniority: string;
    start_date: string;
    total_revenue: number;
    work_email: string;
    firstname: string;
    hs_analytics_first_url: string;
    hs_email_delivered: number;
    hs_email_optout_78547538: number;
    twitterhandle: string;
    currentlyinworkflow: number;
    followercount: number;
    hs_analytics_last_url: string;
    hs_email_open: number;
    lastname: string;
    hs_analytics_num_page_views: number;
    hs_email_click: number;
    salutation: string;
    twitterprofilephoto: string;
    email: string;
    hs_analytics_num_visits: number;
    hs_email_bounce: number;
    hs_persona: number;
    hs_social_last_engagement: Date;
    hs_analytics_num_event_completions: number;
    hs_email_optout: boolean;
    hs_social_twitter_clicks: number;
    mobilephone: string;
    phone: string;
    fax: string;
    hs_analytics_first_timestamp: Date;
    hs_email_last_email_name: string;
    hs_email_last_send_date: Date;
    hs_social_facebook_clicks: number;
    address: string;
    engagements_last_meeting_booked: Date;
    engagements_last_meeting_booked_campaign: string;
    engagements_last_meeting_booked_medium: string;
    engagements_last_meeting_booked_source: string;
    hs_analytics_first_visit_timestamp: Date;
    hs_email_last_open_date: Date;
    hs_latest_meeting_activity: Date;
    hs_sales_email_last_replied: Date;
    hs_social_linkedin_clicks: number;
    hubspot_owner_id: number;
    notes_last_contacted: Date;
    notes_last_updated: Date;
    notes_next_activity_date: Date;
    num_contacted_notes: number;
    num_notes: number;
    owneremail: string;
    ownername: string;
    surveymonkeyeventlastupdated: number;
    webinareventlastupdated: number;
    city: string;
    hs_analytics_last_timestamp: Date;
    hs_email_last_click_date: Date;
    hs_social_google_plus_clicks: number;
    hubspot_team_id: number;
    linkedinbio: string;
    twitterbio: string;
    hs_all_owner_ids: number;
    hs_analytics_last_visit_timestamp: Date;
    hs_email_first_send_date: Date;
    hs_social_num_broadcast_clicks: number;
    state: string;
    hs_all_team_ids: number;
    hs_analytics_source: number;
    hs_email_first_open_date: Date;
    hs_latest_source: number;
    zip: string;
    country: string;
    hs_all_accessible_team_ids: number;
    hs_analytics_source_data_1: string;
    hs_email_first_click_date: Date;
    hs_latest_source_data_1: string;
    linkedinconnections: number;
    hs_analytics_source_data_2: string;
    hs_email_is_ineligible: boolean;
    hs_language: number;
    hs_latest_source_data_2: string;
    kloutscoregeneral: number;
    hs_analytics_first_referrer: string;
    hs_email_first_reply_date: Date;
    jobtitle: string;
    photo: string;
    hs_analytics_last_referrer: string;
    hs_email_last_reply_date: Date;
    message: string;
    closedate: Date;
    hs_analytics_average_page_views: number;
    hs_email_replied: number;
    hs_analytics_revenue: number;
    hs_lifecyclestage_lead_date: Date;
    hs_lifecyclestage_marketingqualifiedlead_date: Date;
    hs_lifecyclestage_opportunity_date: Date;
    lifecyclestage: number;
    hs_lifecyclestage_salesqualifiedlead_date: Date;
    createdate: Date;
    hs_lifecyclestage_evangelist_date: Date;
    hs_lifecyclestage_customer_date: Date;
    hubspotscore: number;
    company: string;
    hs_lifecyclestage_subscriber_date: Date;
    hs_lifecyclestage_other_date: Date;
    website: string;
    numemployees: number;
    annualrevenue: string;
    industry: string;
    associatedcompanyid: number;
    associatedcompanylastupdated: number;
    hs_predictivecontactscorebucket: number;
    hs_predictivecontactscore: number;
}
export interface ZohoContact {
    Owner: string;
    Lead_Source: string;
    First_Name: string;
    Last_Name: string;
    Full_Name: string;
    Account_Name: string;
    Email: string;
    Title: string;
    Department: string;
    Phone: string;
    Home_Phone: string;
    Other_Phone: string;
    Fax: string;
    Mobile: string;
    Date_of_Birth: Date;
    Assistant: string;
    Asst_Phone: string;
    Email_Opt_Out: boolean;
    Created_By: string;
    Skype_ID: string;
    Modified_By: string;
    Created_Time: Date;
    Modified_Time: Date;
    Salutation: string;
    Secondary_Email: string;
    Last_Activity_Time: Date;
    Twitter: string;
    Reporting_To: string;
    Unsubscribed_Mode: string;
    Unsubscribed_Time: Date;
    Last_Enriched_Time__s: Date;
    Enrich_Status__s: string;
    Mailing_Street: string;
    Other_Street: string;
    Mailing_City: string;
    Other_City: string;
    Mailing_State: string;
    Other_State: string;
    Mailing_Zip: string;
    Other_Zip: string;
    Mailing_Country: string;
    Other_Country: string;
    Description: string;
    Record_Image: string;
}
export interface SalesforceContact {
    Id: string;
    IsDeleted: boolean;
    MasterRecordId: string;
    AccountId: string;
    LastName: string;
    FirstName: string;
    Salutation: string;
    Name: string;
    OtherStreet: string;
    OtherCity: string;
    OtherState: string;
    OtherPostalCode: string;
    OtherCountry: string;
    OtherLatitude: number;
    OtherLongitude: number;
    OtherGeocodeAccuracy: string;
    OtherAddress: { [key: string]: any };
    MailingStreet: string;
    MailingCity: string;
    MailingState: string;
    MailingPostalCode: string;
    MailingCountry: string;
    MailingLatitude: number;
    MailingLongitude: number;
    MailingGeocodeAccuracy: string;
    MailingAddress: { [key: string]: any };
    Phone: string;
    Fax: string;
    MobilePhone: string;
    HomePhone: string;
    OtherPhone: string;
    AssistantPhone: string;
    ReportsToId: string;
    Email: string;
    Title: string;
    Department: string;
    AssistantName: string;
    LeadSource: string;
    Birthdate: Date;
    Description: string;
    OwnerId: string;
    CreatedDate: Date;
    CreatedById: string;
    LastModifiedDate: Date;
    LastModifiedById: string;
    SystemModstamp: Date;
    LastActivityDate: Date;
    LastCURequestDate: Date;
    LastCUUpdateDate: Date;
    LastViewedDate: Date;
    LastReferencedDate: Date;
    EmailBouncedReason: string;
    EmailBouncedDate: Date;
    IsEmailBounced: boolean;
    PhotoUrl: string;
    Jigsaw: string;
    JigsawContactId: string;
    CleanStatus: string;
    IndividualId: string;
}

export function toSalesforceContact(unifiedContact: UnifiedContact): Partial<SalesforceContact> {
    const salesforceContact: any = {
        Id: unifiedContact.remoteId,
        LastName: unifiedContact.lastName,
        FirstName: unifiedContact.firstName,
        Phone: unifiedContact.phone,
        Email: unifiedContact.email,
    };

    // Map custom fields
    if (unifiedContact.additional) {
        Object.keys(unifiedContact.additional).forEach((key) => {
            salesforceContact[key] = unifiedContact.additional?.[key];
        });
    }

    return salesforceContact;
}

export function toZohoContact(unifiedContact: UnifiedContact): ZohoContact {
    const zohoContact: any = {
        Owner: unifiedContact.additional?.ownerId,
        Lead_Source: unifiedContact.additional?.leadSource,
        First_Name: unifiedContact.firstName,
        Last_Name: unifiedContact.lastName,
        Full_Name: unifiedContact.additional?.name,
        Account_Name: unifiedContact.additional?.accountId,
        Email: unifiedContact.email,
        Title: unifiedContact.additional?.title,
        Department: unifiedContact.additional?.department,
        Phone: unifiedContact.phone,
        Home_Phone: unifiedContact.additional?.homePhone,
        Other_Phone: unifiedContact.additional?.otherPhone,
        Fax: unifiedContact.additional?.fax,
        Mobile: unifiedContact.additional?.mobilePhone,
        Date_of_Birth: unifiedContact.additional?.birthdate,
        Assistant: unifiedContact.additional?.assistantName,
        Asst_Phone: unifiedContact.additional?.assistantPhone,
        Email_Opt_Out: unifiedContact.additional?.isEmailBounced,
        Created_By: unifiedContact.additional?.createdById,
        Modified_By: unifiedContact.additional?.lastModifiedById,
        Created_Time: unifiedContact.createdTimestamp,
        Modified_Time: unifiedContact.updatedTimestamp,
        Salutation: unifiedContact.additional?.salutation,
        Last_Activity_Time: unifiedContact.additional?.lastActivityDate,
        Reporting_To: unifiedContact.additional?.reportsToId,
        Mailing_Street: unifiedContact.additional?.mailingStreet,
        Other_Street: unifiedContact.additional?.otherStreet,
        Mailing_City: unifiedContact.additional?.mailingCity,
        Other_City: unifiedContact.additional?.otherCity,
        Mailing_State: unifiedContact.additional?.mailingState,
        Other_State: unifiedContact.additional?.otherState,
        Mailing_Zip: unifiedContact.additional?.mailingPostalCode,
        Other_Zip: unifiedContact.additional?.otherPostalCode,
        Mailing_Country: unifiedContact.additional?.mailingCountry,
        Other_Country: unifiedContact.additional?.otherCountry,
        Description: unifiedContact.additional?.description,
        Record_Image: unifiedContact.additional?.photoUrl,
    };
    return zohoContact;
}

export function toHubspotContact(unifiedContact: UnifiedContact): Partial<HubspotContact> {
    const hubspotContact: any = {
        properties: {
            id: unifiedContact.remoteId,
            firstname: unifiedContact.firstName,
            lastname: unifiedContact.lastName,
            email: unifiedContact.email,
            phone: unifiedContact.phone,
        },
    };

    // Map custom fields
    if (unifiedContact.additional) {
        Object.keys(unifiedContact.additional).forEach((key) => {
            hubspotContact['properties'][key] = unifiedContact.additional?.[key];
        });
    }

    return hubspotContact;
}

// To determine if a field is a user defined custom field using the properties API:
// Hubspot: `hubspotDefined` is false and calculated is false
// ZohoCRM: `custom_field` is true
// SFDC: `custom` is true.
export function disunifyContact(contact: UnifiedContact, integrationId: string): any {
    if (integrationId === 'sfdc') {
        return toSalesforceContact(contact);
    } else if (integrationId === 'hubspot') {
        return toHubspotContact(contact);
    } else if (integrationId === 'zohocrm') {
        return toZohoContact(contact);
    }
}
