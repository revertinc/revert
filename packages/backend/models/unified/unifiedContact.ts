export interface UnifiedContact {
    id: string;
    isDeleted: boolean;
    masterRecordId?: string;
    accountId: string;
    lastName: string;
    firstName: string;
    salutation?: string;
    name?: string;
    otherStreet?: string;
    otherCity?: string;
    otherState?: string;
    otherPostalCode?: string;
    otherCountry?: string;
    otherLatitude?: number;
    otherLongitude?: number;
    otherGeocodeAccuracy?: string;
    otherAddress?: { [key: string]: any };
    mailingStreet?: string;
    mailingCity?: string;
    mailingState?: string;
    mailingPostalCode?: string;
    mailingCountry?: string;
    mailingLatitude?: number;
    mailingLongitude?: number;
    mailingGeocodeAccuracy?: string;
    mailingAddress?: { [key: string]: any };
    phone?: string;
    fax?: string;
    mobilePhone?: string;
    homePhone?: string;
    otherPhone?: string;
    assistantPhone?: string;
    reportsToId?: string;
    email?: string;
    title?: string;
    department?: string;
    assistantName?: string;
    leadSource?: string;
    birthdate?: Date;
    description?: string;
    ownerId: string;
    createdDate: Date;
    createdById: string;
    lastModifiedDate: Date;
    lastModifiedById: string;
    systemModstamp: Date;
    lastActivityDate?: Date;
    lastCURequestDate?: Date;
    lastCUUpdateDate?: Date;
    lastViewedDate?: Date;
    lastReferencedDate?: Date;
    emailBouncedReason?: string;
    emailBouncedDate?: Date;
    isEmailBounced?: boolean;
    photoUrl?: string;
    jigsaw?: string;
    jigsawContactId?: string;
    cleanStatus?: string;
    individualId?: string;
    level?: string;
    languages?: string[];
    customFields?: { [key: string]: any };
}

export function unifyContact(contact: any): UnifiedContact {
    const unifiedContact = {
        id: contact.id || contact.ContactID || contact.contact_id,
        name: contact.Name,
        isDeleted: contact.isDeleted || false,
        firstName: contact.firstName || contact.firstname || contact.FirstName || contact.First_Name,
        lastName: contact.lastName || contact.lastname || contact.LastName || contact.Last_Name,
        email: contact.email || contact.emailaddress || '',
        phone: contact.phone || contact.phone_number || '',
        address: contact.address || contact.address1 || '',
        city: contact.city || contact.city_name || '',
        state: contact.state || contact.state_name || '',
        country: contact.country || contact.country_name || '',
        zip: contact.zip || contact.postalcode || '',
        createdAt: contact.createdAt || contact.created_time || '',
        updatedAt: contact.updatedAt || contact.last_modified_time || '',
        source: contact.source || '',
        description: contact.description || '',
        owner: contact.owner || contact.owner_name || '',
        accountId: contact.accountId,
        ownerId: contact.ownerId,
        createdDate: contact.createdDate,
        createdById: contact.createdById,
        lastModifiedDate: contact.lastModifiedDate,
        lastModifiedById: contact.lastModifiedById,
        systemModstamp: contact.systemModstamp,
    };

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
    revertdotdev__Level__c: string;
    revertdotdev__Languages__c: string;
}

export function toSalesforceContact(unifiedContact: UnifiedContact): Partial<SalesforceContact> {
    const salesforceContact: any = {
        Id: unifiedContact.id,
        IsDeleted: unifiedContact.isDeleted,
        MasterRecordId: unifiedContact.masterRecordId || '',
        AccountId: unifiedContact.accountId,
        LastName: unifiedContact.lastName,
        FirstName: unifiedContact.firstName,
        Salutation: unifiedContact.salutation || '',
        Name: unifiedContact.name || '',
        OtherStreet: unifiedContact.otherStreet || '',
        OtherCity: unifiedContact.otherCity || '',
        OtherState: unifiedContact.otherState || '',
        OtherPostalCode: unifiedContact.otherPostalCode || '',
        OtherCountry: unifiedContact.otherCountry || '',
        OtherLatitude: unifiedContact.otherLatitude || 0,
        OtherLongitude: unifiedContact.otherLongitude || 0,
        OtherGeocodeAccuracy: unifiedContact.otherGeocodeAccuracy || '',
        OtherAddress: unifiedContact.otherAddress || {},
        MailingStreet: unifiedContact.mailingStreet || '',
        MailingCity: unifiedContact.mailingCity || '',
        MailingState: unifiedContact.mailingState || '',
        MailingPostalCode: unifiedContact.mailingPostalCode || '',
        MailingCountry: unifiedContact.mailingCountry || '',
        MailingLatitude: unifiedContact.mailingLatitude || 0,
        MailingLongitude: unifiedContact.mailingLongitude || 0,
        MailingGeocodeAccuracy: unifiedContact.mailingGeocodeAccuracy || '',
        MailingAddress: unifiedContact.mailingAddress || {},
        Phone: unifiedContact.phone || '',
        Fax: unifiedContact.fax || '',
        MobilePhone: unifiedContact.mobilePhone || '',
        HomePhone: unifiedContact.homePhone || '',
        OtherPhone: unifiedContact.otherPhone || '',
        AssistantPhone: unifiedContact.assistantPhone || '',
        ReportsToId: unifiedContact.reportsToId || '',
        Email: unifiedContact.email || '',
        Title: unifiedContact.title || '',
        Department: unifiedContact.department || '',
        AssistantName: unifiedContact.assistantName || '',
        LeadSource: unifiedContact.leadSource || '',
        Birthdate: unifiedContact.birthdate!,
        Description: unifiedContact.description || '',
        OwnerId: unifiedContact.ownerId,
        CreatedDate: unifiedContact.createdDate,
        CreatedById: unifiedContact.createdById,
        LastModifiedDate: unifiedContact.lastModifiedDate,
        LastModifiedById: unifiedContact.lastModifiedById,
        SystemModstamp: unifiedContact.systemModstamp,
        LastActivityDate: unifiedContact.lastActivityDate!,
        LastCURequestDate: unifiedContact.lastCURequestDate!,
        LastCUUpdateDate: unifiedContact.lastCUUpdateDate!,
        LastViewedDate: unifiedContact.lastViewedDate!,
        LastReferencedDate: unifiedContact.lastReferencedDate!,
        EmailBouncedReason: unifiedContact.emailBouncedReason!,
        EmailBouncedDate: unifiedContact.emailBouncedDate!,
        IsEmailBounced: unifiedContact.isEmailBounced || false,
        PhotoUrl: unifiedContact.photoUrl || '',
        Jigsaw: unifiedContact.jigsaw || '',
        JigsawContactId: unifiedContact.jigsawContactId || '',
        CleanStatus: unifiedContact.cleanStatus || '',
        IndividualId: unifiedContact.individualId || '',
        revertdotdev__Level__c: unifiedContact.level || '',
        revertdotdev__Languages__c: unifiedContact.languages ? unifiedContact.languages.join(';') : '',
    };

    // Map custom fields
    if (unifiedContact.customFields) {
        Object.keys(unifiedContact.customFields).forEach((key) => {
            salesforceContact[key] = unifiedContact.customFields?.[key];
        });
    }

    return salesforceContact;
}

export function toZohoContact(unifiedContact: UnifiedContact): ZohoContact {
    const zohoContact: any = {
        Owner: unifiedContact.ownerId,
        Lead_Source: unifiedContact.leadSource,
        First_Name: unifiedContact.firstName,
        Last_Name: unifiedContact.lastName,
        Full_Name: unifiedContact.name,
        Account_Name: unifiedContact.accountId,
        Email: unifiedContact.email,
        Title: unifiedContact.title,
        Department: unifiedContact.department,
        Phone: unifiedContact.phone,
        Home_Phone: unifiedContact.homePhone,
        Other_Phone: unifiedContact.otherPhone,
        Fax: unifiedContact.fax,
        Mobile: unifiedContact.mobilePhone,
        Date_of_Birth: unifiedContact.birthdate,
        Assistant: unifiedContact.assistantName,
        Asst_Phone: unifiedContact.assistantPhone,
        Email_Opt_Out: unifiedContact.isEmailBounced,
        Created_By: unifiedContact.createdById,
        Skype_ID: undefined, // Zoho does not have this field
        Modified_By: unifiedContact.lastModifiedById,
        Created_Time: unifiedContact.createdDate,
        Modified_Time: unifiedContact.lastModifiedDate,
        Salutation: unifiedContact.salutation,
        Secondary_Email: undefined, // Zoho does not have this field
        Last_Activity_Time: unifiedContact.lastActivityDate,
        Twitter: undefined, // Zoho does not have this field
        Reporting_To: unifiedContact.reportsToId,
        Unsubscribed_Mode: undefined, // Zoho does not have this field
        Unsubscribed_Time: undefined, // Zoho does not have this field
        Last_Enriched_Time__s: undefined, // Zoho does not have this field
        Enrich_Status__s: undefined, // Zoho does not have this field
        Mailing_Street: unifiedContact.mailingStreet,
        Other_Street: unifiedContact.otherStreet,
        Mailing_City: unifiedContact.mailingCity,
        Other_City: unifiedContact.otherCity,
        Mailing_State: unifiedContact.mailingState,
        Other_State: unifiedContact.otherState,
        Mailing_Zip: unifiedContact.mailingPostalCode,
        Other_Zip: unifiedContact.otherPostalCode,
        Mailing_Country: unifiedContact.mailingCountry,
        Other_Country: unifiedContact.otherCountry,
        Description: unifiedContact.description,
        Record_Image: unifiedContact.photoUrl,
    };
    return zohoContact;
}

export function toHubspotContact(unifiedContact: any): Partial<HubspotContact> {
    const hubspotContact = {
        company_size: unifiedContact.companySize,
        date_of_birth: unifiedContact.birthdate,
        degree: unifiedContact.degree,
        field_of_study: unifiedContact.fieldOfStudy,
        first_deal_created_date: unifiedContact.firstDealCreatedDate,
        gender: unifiedContact.gender,
        graduation_date: unifiedContact.graduationDate,
        hs_all_assigned_business_unit_ids: unifiedContact.allAssignedBusinessUnitIds,
        hs_analytics_first_touch_converting_campaign: unifiedContact.analyticsFirstTouchConvertingCampaign,
        hs_analytics_last_touch_converting_campaign: unifiedContact.analyticsLastTouchConvertingCampaign,
        hs_avatar_filemanager_key: unifiedContact.avatarFilemanagerKey,
        hs_buying_role: unifiedContact.buyingRole,
        hs_clicked_linkedin_ad: unifiedContact.clickedLinkedinAd,
        hs_content_membership_email: unifiedContact.contentMembershipEmail,
        hs_content_membership_email_confirmed: unifiedContact.contentMembershipEmailConfirmed,
        hs_content_membership_follow_up_enqueued_at: unifiedContact.contentMembershipFollowUpEnqueuedAt,
        hs_content_membership_notes: unifiedContact.contentMembershipNotes,
        hs_content_membership_registered_at: unifiedContact.contentMembershipRegisteredAt,
        hs_content_membership_registration_domain_sent_to: unifiedContact.contentMembershipRegistrationDomainSentTo,
        hs_content_membership_registration_email_sent_at: unifiedContact.contentMembershipRegistrationEmailSentAt,
        hs_content_membership_status: unifiedContact.contentMembershipStatus,
        hs_conversations_visitor_email: unifiedContact.conversationsVisitorEmail,
        hs_count_is_unworked: unifiedContact.countIsUnworked,
        hs_count_is_worked: unifiedContact.countIsWorked,
        hs_created_by_conversations: unifiedContact.createdByConversations,
        hs_created_by_user_id: unifiedContact.createdByUserId,
        hs_createdate: unifiedContact.createdDate,
        hs_date_entered_customer: unifiedContact.dateEnteredCustomer,
        hs_date_entered_evangelist: unifiedContact.dateEnteredEvangelist,
        hs_date_entered_lead: unifiedContact.dateEnteredLead,
        hs_date_entered_marketingqualifiedlead: unifiedContact.dateEnteredMarketingQualifiedLead,
        hs_date_entered_opportunity: unifiedContact.dateEnteredOpportunity,
        hs_date_entered_other: unifiedContact.dateEnteredOther,
        hs_date_entered_salesqualifiedlead: unifiedContact.dateEnteredSalesQualifiedLead,
        hs_date_entered_subscriber: unifiedContact.dateEnteredSubscriber,
        hs_date_exited_customer: unifiedContact.dateExitedCustomer,
        hs_date_exited_evangelist: unifiedContact.dateExitedEvangelist,
        hs_date_exited_lead: unifiedContact.dateExitedLead,
        hs_date_exited_marketingqualifiedlead: unifiedContact.dateExitedMarketingQualifiedLead,
        hs_date_exited_opportunity: unifiedContact.dateExitedOpportunity,
        hs_date_exited_other: unifiedContact.dateExitedOther,
        hs_date_exited_salesqualifiedlead: unifiedContact.dateExitedSalesQualifiedLead,
        hs_date_exited_subscriber: unifiedContact.dateExitedSubscriber,
        hs_document_last_revisited: unifiedContact.documentLastRevisited,
        hs_email_bad_address: unifiedContact.emailBadAddress,
        hs_email_customer_quarantined_reason: unifiedContact.emailCustomerQuarantinedReason,
        hs_email_hard_bounce_reason: unifiedContact.emailHardBounceReason,
        hs_email_hard_bounce_reason_number: unifiedContact.emailHardBounceReasonNumber,
        hs_email_quarantined: unifiedContact.emailQuarantined,
        hs_email_quarantined_reason: unifiedContact.emailQuarantinedReason,
    };
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
