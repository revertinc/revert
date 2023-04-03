export interface UnifiedLead {
    id: string;
    remoteId: string;
    owner?: string;
    company?: string;
    name?: string;
    firstName?: string;
    salutation?: string;
    lastName?: string;
    fullName?: string;
    designation?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    fax?: string;
    leadSource?: string;
    website?: string;
    annualRevenue?: number;
    leadStatus?: string;
    industry?: string;
    emailOptOut?: boolean;
    numberOfEmployees?: number;
    modifiedBy?: string;
    rating?: string;
    exchangeRate?: number;
    createdBy?: string;
    skypeId?: string;
    secondaryEmail?: string;
    twitter?: string;
    modifiedTime?: Date;
    currency?: string;
    tag?: string[];
    lastActivityTime?: Date;
    createdTime?: Date;
    unsubscribedMode?: boolean;
    convertedAccount?: string;
    leadConversionTime?: Date;
    convertedDeal?: string;
    unsubscribedTime?: Date;
    dataProcessingBasisDetails?: string;
    convertedContact?: string;
    dataSource?: string;
    dataProcessingBasis?: string;
    wizard?: boolean;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    description?: string;
    recordImage?: string;
    alternateAddress?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        zipCode: string;
    };
    status?: string;
    tags?: string;
    social?: {
        twitter: string;
        linkedin: string;
        facebook: string;
    };
    customFields?: { [key: string]: any };
}

export function unifyLead(lead: any): UnifiedLead {
    return {
        id: lead.id || lead.Id || lead.vid,
        remoteId: lead.id || lead.Id || lead.vid,
        name: lead.Name,
        firstName: lead.firstName || lead.First_Name || lead.FirstName,
        lastName: lead.lastName || lead.Last_Name || lead.LastName,
        email: lead.email || lead.Email,
        phone: lead.phone || lead.Phone || lead.PhoneNumber,
        company: lead.company || lead.Company,
        website: lead.website || lead.Website,
        address: {
            street: lead.street || lead.Street || lead.Address,
            city: lead.city || lead.City,
            zipCode: lead.zip || lead.zipCode || lead.Zip_Code,
            state:
                lead.state ||
                lead.State ||
                lead.province ||
                lead.Province ||
                lead.StateCode ||
                lead.State_Code ||
                lead.StateCode__c,
            postalCode: lead.postalCode || lead.Zip_Code || lead.PostalCode,
            country: lead.country || lead.Country || lead.CountryCode || lead.Country_Code || lead.Country__c,
        },
        leadSource: lead.leadSource || lead.Lead_Source || lead.utm_source || lead.Original_Source_Type__c,
        status: lead.status || lead.Lead_Status || lead.lead_status || lead.Status__c,
        industry: lead.industry || lead.Industry || lead.Industry__c,
        rating: lead.rating || lead.Rating,
        owner: lead.owner || lead.Owner || lead.ownerId || lead.OwnerId,
        createdBy: lead.createdBy || lead.Created_By || lead.CreatedById,
        createdTime: lead.createdTime || lead.Created_Time || lead.created_at,
        modifiedBy: lead.modifiedBy || lead.Modified_By || lead.ModifiedById,
        modifiedTime: lead.modifiedTime || lead.Modified_Time || lead.updated_at,
        description: lead.description || lead.Description,
        tags: lead.tags || lead.Tag?.split(',') || lead.tags,
        social: {
            twitter: lead.twitter || lead.Twitter_Handle__c,
            linkedin: lead.linkedin || lead.LinkedIn_Profile_URL__c,
            facebook: lead.facebook || lead.Facebook_Profile_URL__c,
        },
        customFields: {
            annualRevenue: lead.annualRevenue || lead.Annual_Revenue || lead.AnnualRevenue,
            designation: lead.designation || lead.Designation || lead.Job_Title__c,
        },
    };
}

export interface HubspotLead {
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
    hs_lead_source: string;
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
    firstname?: string;
    hs_analytics_first_url: string;
    hs_email_delivered: number;
    hs_email_optout_78547538: number;
    twitterhandle: string;
    currentlyinworkflow: number;
    followercount: number;
    hs_analytics_last_url: string;
    hs_email_open: number;
    lastname?: string;
    hs_analytics_num_page_views: number;
    hs_email_click: number;
    salutation: string;
    twitterprofilephoto: string;
    email?: string;
    hs_analytics_num_visits: number;
    hs_email_bounce: number;
    hs_persona: number;
    hs_social_last_engagement: Date;
    hs_analytics_num_event_completions: number;
    hs_email_optout: boolean;
    hs_social_twitter_clicks: number;
    mobilephone: string;
    phone?: string;
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
    city?: string;
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
    state?: string;
    hs_all_team_ids: number;
    hs_analytics_source: number;
    hs_email_first_open_date: Date;
    hs_latest_source: number;
    zip?: string;
    country?: string;
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
    company?: string;
    hs_lifecyclestage_subscriber_date: Date;
    hs_lifecyclestage_other_date: Date;
    website?: string;
    numemployees: number;
    annualrevenue: number;
    industry: string;
    associatedcompanyid: number;
    associatedcompanylastupdated: number;
    hs_predictivecontactscorebucket: number;
    hs_predictivecontactscore: number;
}
export interface ZohoLead {
    Owner: string;
    Company: string;
    First_Name: string;
    Last_Name: string;
    Full_Name: string;
    Designation: string;
    Email: string;
    Phone: string;
    Fax: string;
    Mobile: string;
    Website: string;
    Lead_Source: string;
    Lead_Status: string;
    Industry: string;
    No_of_Employees: number;
    Annual_Revenue: number;
    Rating: string;
    Created_By: string;
    Email_Opt_Out: boolean;
    Skype_ID: string;
    Modified_By: string;
    Created_Time: Date;
    Modified_Time: Date;
    Salutation: string;
    Secondary_Email: string;
    Twitter: string;
    Last_Activity_Time: Date;
    Lead_Conversion_Time: number;
    Unsubscribed_Mode: string;
    Unsubscribed_Time: Date;
    Converted_Account: string;
    Converted_Contact: string;
    Converted_Deal: string;
    Last_Enriched_Time__s: Date;
    Enrich_Status__s: string;
    Street: string;
    City: string;
    State: string;
    Zip_Code: string;
    Country: string;
    Description: string;
    Record_Image: string;
}
export interface SalesforceLead {
    Id: string;
    IsDeleted: boolean;
    MasterRecordId: string;
    LastName: string;
    FirstName: string;
    Salutation: string;
    Name: string;
    Title: string;
    Company: string;
    Street: string;
    City: string;
    State: string;
    PostalCode: string;
    Country: string;
    Latitude: number;
    Longitude: number;
    GeocodeAccuracy: string;
    Address: { [key: string]: any };
    Phone: string;
    MobilePhone: string;
    Fax: string;
    Email: string;
    Website: string;
    PhotoUrl: string;
    Description: string;
    LeadSource: string;
    Status: string;
    Industry: string;
    Rating: string;
    AnnualRevenue: number;
    NumberOfEmployees: number;
    OwnerId: string;
    IsConverted: boolean;
    ConvertedDate: Date;
    ConvertedAccountId: string;
    ConvertedContactId: string;
    ConvertedOpportunityId: string;
    IsUnreadByOwner: boolean;
    CreatedDate: Date;
    CreatedById: string;
    LastModifiedDate: Date;
    LastModifiedById: string;
    SystemModstamp: Date;
    LastActivityDate: Date;
    LastViewedDate: Date;
    LastReferencedDate: Date;
    Jigsaw: string;
    JigsawContactId: string;
    CleanStatus: string;
    CompanyDunsNumber: string;
    DandbCompanyId: string;
    EmailBouncedReason: string;
    EmailBouncedDate: Date;
    IndividualId: string;
    revertdotdev__SICCode__c: string;
    revertdotdev__ProductInterest__c: string;
    revertdotdev__Primary__c: string;
    revertdotdev__CurrentGenerators__c: string;
    revertdotdev__NumberofLocations__c: number;
}

export function toUnifiedLead(lead: HubspotLead): UnifiedLead {
    const unifiedLead: UnifiedLead = {
        id: String(lead.hs_object_id),
        remoteId: String(lead.hs_object_id),
        company: lead.company,
        name: lead.firstname && lead.lastname ? `${lead.firstname} ${lead.lastname}` : undefined,
        firstName: lead.firstname,
        lastName: lead.lastname,
        email: lead.email,
        phone: lead.phone,
        mobile: lead.mobilephone,
        leadSource: lead.hs_lead_source,
        website: lead.website,
        leadStatus: String(lead.hs_lead_status),
        industry: lead.industry,
        numberOfEmployees: lead.numemployees,
        createdBy: String(lead.hs_created_by_user_id),
        createdTime: lead.createdate,
        modifiedTime: lead.hs_lastmodifieddate,
        status: String(lead.hs_lead_status),
        tags: lead.hs_analytics_source_data_1,
        social: {
            twitter: lead.twitterhandle,
            linkedin: lead.hs_linkedinid,
            facebook: lead.hs_facebookid,
        },
        customFields: {
            company_size: lead.company_size,
            date_of_birth: lead.date_of_birth,
            degree: lead.degree,
            field_of_study: lead.field_of_study,
            gender: lead.gender,
            graduation_date: lead.graduation_date,
            buying_role: lead.hs_buying_role,
            clicked_linkedin_ad: lead.hs_clicked_linkedin_ad,
            conversations_visitor_email: lead.hs_conversations_visitor_email,
            count_is_unworked: lead.hs_count_is_unworked,
            count_is_worked: lead.hs_count_is_worked,
            document_last_revisited: lead.hs_document_last_revisited,
            email_bad_address: lead.hs_email_bad_address,
            email_customer_quarantined_reason: lead.hs_email_customer_quarantined_reason,
            email_hard_bounce_reason: lead.hs_email_hard_bounce_reason,
            email_hard_bounce_reason_number: lead.hs_email_hard_bounce_reason_number,
            email_quarantined: lead.hs_email_quarantined,
            email_quarantined_reason: lead.hs_email_quarantined_reason,
            email_recipient_fatigue_recovery_time: lead.hs_email_recipient_fatigue_recovery_time,
            email_sends_since_last_engagement: lead.hs_email_sends_since_last_engagement,
            emailconfirmationstatus: lead.hs_emailconfirmationstatus,
            facebook_ad_clicked: lead.hs_facebook_ad_clicked,
            facebook_click_id: lead.hs_facebook_click_id,
            facebookid: lead.hs_facebookid,
            feedback_last_nps_follow_up: lead.hs_feedback_last_nps_follow_up,
            feedback_last_nps_rating: lead.hs_feedback_last_nps_rating,
            feedback_last_survey_date: lead.hs_feedback_last_survey_date,
            feedback_show_nps_web_survey: lead.hs_feedback_show_nps_web_survey,
            google_click_id: lead.hs_google_click_id,
            googleplusid: lead.hs_googleplusid,
            has_active_subscription: lead.hs_has_active_subscription,
            ip_timezone: lead.hs_ip_timezone,
            is_unworked: lead.hs_is_unworked,
            last_sales_activity_date: lead.hs_last_sales_activity_date,
            last_sales_activity_timestamp: lead.hs_last_sales_activity_timestamp,
            last_sales_activity_type: lead.hs_last_sales_activity_type,
            latest_sequence_enrolled: lead.hs_latest_sequence_enrolled,
            latest_sequence_enrolled_date: lead.hs_latest_sequence_enrolled_date,
            latest_sequence_finished_date: lead.hs_latest_sequence_finished_date,
            latest_sequence_unenrolled_date: lead.hs_latest_sequence_unenrolled_date,
        },
    };
    return unifiedLead;
}

export function toSalesforceLead(unifiedLead: UnifiedLead): SalesforceLead {
    const salesforceLead: any = {};

    // Map common fields
    salesforceLead.Id = unifiedLead.id;
    salesforceLead.LastName = unifiedLead.lastName || '';
    salesforceLead.FirstName = unifiedLead.firstName || '';
    salesforceLead.Salutation = unifiedLead.salutation || '';
    salesforceLead.Name = unifiedLead.name || '';
    salesforceLead.Title = unifiedLead.designation || '';
    salesforceLead.Company = unifiedLead.company || '';
    salesforceLead.Street = unifiedLead.street || '';
    salesforceLead.City = unifiedLead.city || '';
    salesforceLead.State = unifiedLead.state || '';
    salesforceLead.PostalCode = unifiedLead.zipCode || '';
    salesforceLead.Country = unifiedLead.country || '';
    salesforceLead.Phone = unifiedLead.phone || '';
    salesforceLead.MobilePhone = unifiedLead.mobile || '';
    salesforceLead.Fax = unifiedLead.fax || '';
    salesforceLead.Email = unifiedLead.email || '';
    salesforceLead.Website = unifiedLead.website || '';
    salesforceLead.Description = unifiedLead.description || '';
    salesforceLead.LeadSource = unifiedLead.leadSource || '';
    salesforceLead.Status = unifiedLead.leadStatus || '';
    salesforceLead.Industry = unifiedLead.industry || '';
    salesforceLead.Rating = unifiedLead.rating || '';
    salesforceLead.AnnualRevenue = unifiedLead.annualRevenue || 0;
    salesforceLead.NumberOfEmployees = unifiedLead.numberOfEmployees || 0;
    salesforceLead.OwnerId = unifiedLead.owner || '';
    salesforceLead.IsConverted = false;
    salesforceLead.CreatedDate = unifiedLead.createdTime || new Date();
    salesforceLead.CreatedById = unifiedLead.createdBy || '';
    salesforceLead.LastModifiedDate = unifiedLead.modifiedTime || new Date();
    salesforceLead.LastModifiedById = unifiedLead.modifiedBy || '';
    salesforceLead.LastActivityDate = unifiedLead.lastActivityTime || new Date();

    // Map custom fields
    if (unifiedLead.customFields) {
        Object.keys(unifiedLead.customFields).forEach((key) => {
            salesforceLead[key] = unifiedLead.customFields?.[key];
        });
    }

    return salesforceLead as SalesforceLead;
}

export function toZohoLead(unifiedLead: UnifiedLead): ZohoLead {
    const zohoLead: any = {};

    zohoLead.Owner = unifiedLead.owner;
    zohoLead.Company = unifiedLead.company;
    zohoLead.First_Name = unifiedLead.firstName;
    zohoLead.Last_Name = unifiedLead.lastName;
    zohoLead.Full_Name = unifiedLead.fullName;
    zohoLead.Designation = unifiedLead.designation;
    zohoLead.Email = unifiedLead.email;
    zohoLead.Phone = unifiedLead.phone;
    zohoLead.Fax = unifiedLead.fax;
    zohoLead.Mobile = unifiedLead.mobile;
    zohoLead.Website = unifiedLead.website;
    zohoLead.Lead_Source = unifiedLead.leadSource;
    zohoLead.Lead_Status = unifiedLead.leadStatus;
    zohoLead.Industry = unifiedLead.industry;
    zohoLead.No_of_Employees = unifiedLead.numberOfEmployees;
    zohoLead.Annual_Revenue = unifiedLead.annualRevenue;
    zohoLead.Rating = unifiedLead.rating;
    zohoLead.Created_By = unifiedLead.createdBy;
    zohoLead.Email_Opt_Out = unifiedLead.emailOptOut;
    zohoLead.Skype_ID = unifiedLead.skypeId;
    zohoLead.Modified_By = unifiedLead.modifiedBy;
    zohoLead.Created_Time = unifiedLead.createdTime;
    zohoLead.Modified_Time = unifiedLead.modifiedTime;
    zohoLead.Salutation = unifiedLead.salutation;
    zohoLead.Secondary_Email = unifiedLead.secondaryEmail;
    zohoLead.Twitter = unifiedLead.twitter;
    zohoLead.Last_Activity_Time = unifiedLead.lastActivityTime;
    zohoLead.Lead_Conversion_Time = unifiedLead.leadConversionTime;
    zohoLead.Unsubscribed_Mode = unifiedLead.unsubscribedMode;
    zohoLead.Unsubscribed_Time = unifiedLead.unsubscribedTime;
    zohoLead.Converted_Account = unifiedLead.convertedAccount;
    zohoLead.Converted_Contact = unifiedLead.convertedContact;
    zohoLead.Converted_Deal = unifiedLead.convertedDeal;
    zohoLead.Street = unifiedLead.street;
    zohoLead.City = unifiedLead.city;
    zohoLead.State = unifiedLead.state;
    zohoLead.Zip_Code = unifiedLead.zipCode;
    zohoLead.Country = unifiedLead.country;
    zohoLead.Description = unifiedLead.description;
    zohoLead.Record_Image = unifiedLead.recordImage;

    // Map custom fields
    if (unifiedLead.customFields) {
        Object.keys(unifiedLead.customFields).forEach((key) => {
            zohoLead[key] = unifiedLead.customFields?.[key];
        });
    }

    return zohoLead as ZohoLead;
}

export function toHubspotLead(lead: UnifiedLead): Partial<HubspotLead> {
    const hubspotLead: any = {
        firstname: lead.firstName,
        lastname: lead.lastName,
        email: lead.email,
        company: lead.company,
        phone: lead.phone,
        city: lead.address?.city,
        state: lead.address?.state,
        zip: lead.address?.zipCode,
        country: lead.address?.country,
        website: lead.website,
        hs_lead_source: lead.leadSource!,
    };

    // Map custom fields
    if (lead.customFields) {
        Object.keys(lead.customFields).forEach((key) => {
            hubspotLead[key] = lead.customFields?.[key];
        });
    }
    return hubspotLead;
}

export function disunifyLead(
    lead: UnifiedLead,
    integrationId: string
): Partial<SalesforceLead> | Partial<HubspotLead> | Partial<ZohoLead> | {} {
    if (integrationId === 'sfdc') {
        return toSalesforceLead(lead);
    } else if (integrationId === 'hubspot') {
        return toHubspotLead(lead);
    } else if (integrationId === 'zohocrm') {
        return toZohoLead(lead);
    } else return {};
}
