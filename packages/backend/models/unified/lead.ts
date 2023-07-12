import { TP_ID } from '@prisma/client';

export interface UnifiedLead {
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
    leadType?: 'PERSON' | 'ORGANIZATION'; // for pipedrive
    leadTypeId?: string; // for pipedrive
    // QUESTION: Add value of lead and expected close date here?
}

// FIXME: type support can be better
export function unifyLead(lead: any): UnifiedLead {
    const unifiedlead: UnifiedLead = {
        id: lead.id || lead.Id || lead.vid,
        remoteId: lead.id || lead.Id || lead.vid,
        firstName:
            lead.firstName ||
            lead.First_Name ||
            lead.FirstName ||
            lead.firstname ||
            lead.person?.first_name ||
            lead.organization?.name,
        lastName: lead.lastName || lead.Last_Name || lead.LastName || lead.lastname || lead.person?.last_name,
        email:
            lead.email ||
            lead.Email ||
            lead.person?.primary_email ||
            (lead.person?.email || []).find((e: any) => e?.primary)?.value ||
            lead.person?.email?.[0]?.value ||
            lead.organization?.cc_email,
        phone:
            lead.phone ||
            lead.Phone ||
            lead.PhoneNumber ||
            (lead.person?.phone || []).find((p: any) => p?.primary)?.value ||
            lead.person?.phone?.[0]?.value,
        createdTimestamp:
            lead.createdDate ||
            lead.CreatedDate ||
            lead.Created_Time ||
            lead.hs_timestamp ||
            lead.createdate ||
            lead.add_time,
        updatedTimestamp:
            lead.lastModifiedDate ||
            lead.LastModifiedDate ||
            lead.Modified_Time ||
            lead.lastmodifieddate ||
            lead.update_time,
        additional: {},
        leadType: !!lead.person_id ? 'PERSON' : !!lead.organization_id ? 'ORGANIZATION' : undefined, // for pipedrive
        leadTypeId: lead.person_id || lead.person?.id || lead.organization_id || lead.organization?.id,
    };

    // Map additional fields
    Object.keys(lead).forEach((key) => {
        if (!(key in unifiedlead)) {
            unifiedlead['additional'][key] = lead[key];
        }
    });
    return unifiedlead;
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
    company: string;
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
}

export interface PipedrivePerson {
    id: string;
    company_id: number;
    owner_id: {
        id: number;
        name: string;
        email: string;
        has_pic: number;
        pic_hash: string;
        active_flag: boolean;
        value: number;
    };
    org_id: {
        name: string;
        people_count: number;
        owner_id: number;
        address: string;
        active_flag: boolean;
        cc_email: string;
        value: number;
    };
    name: string;
    first_name: string;
    last_name: string;
    open_deals_count: number;
    related_open_deals_count: number;
    closed_deals_count: number;
    related_closed_deals_count: number;
    participant_open_deals_count: number;
    participant_closed_deals_count: number;
    email_messages_count: number;
    activities_count: number;
    done_activities_count: number;
    undone_activities_count: number;
    files_count: number;
    notes_count: number;
    followers_count: number;
    won_deals_count: number;
    related_won_deals_count: number;
    lost_deals_count: number;
    related_lost_deals_count: number;
    active_flag: boolean;
    phone: { value: string; primary: boolean; label: string }[];
    email: { value: string; primary: boolean; label: string }[];
    primary_email: string;
    first_char: string;
    update_time: string;
    add_time: string;
    visible_to: string;
    marketing_status: string;
    picture_id: {
        item_type: string;
        item_id: number;
        active_flag: boolean;
        add_time: string;
        update_time: string;
        added_by_user_id: number;
        pictures: {
            '128': string;
            '512': string;
        };
        value: number;
    };
    next_activity_date: string;
    next_activity_time: string;
    next_activity_id: number;
    last_activity_id: number;
    last_activity_date: string;
    last_incoming_mail_time: string;
    last_outgoing_mail_time: string;
    label: number;
    org_name: string;
    owner_name: string;
    cc_email: string;
}

export interface PipedriveOrganization {
    id: string;
    company_id: number;
    owner_id: {
        id: number;
        name: string;
        email: string;
        has_pic: number;
        pic_hash: string;
        active_flag: boolean;
        value: number;
    };
    name: string;
    open_deals_count: number;
    related_open_deals_count: number;
    closed_deals_count: number;
    related_closed_deals_count: number;
    email_messages_count: number;
    people_count: number;
    activities_count: number;
    done_activities_count: number;
    undone_activities_count: number;
    files_count: number;
    notes_count: number;
    followers_count: number;
    won_deals_count: number;
    related_won_deals_count: number;
    lost_deals_count: number;
    related_lost_deals_count: number;
    active_flag: boolean;
    picture_id: {
        item_type: string;
        item_id: number;
        active_flag: boolean;
        add_time: string;
        update_time: string;
        added_by_user_id: number;
        pictures: {
            '128': string;
            '512': string;
        };
        value: number;
    };
    country_code: string;
    first_char: string;
    update_time: Date;
    add_time: Date;
    visible_to: string;
    next_activity_date: string;
    next_activity_time: string;
    next_activity_id: number;
    last_activity_id: number;
    last_activity_date: string;
    label: number;
    address: string;
    address_subpremise: string;
    address_street_number: string;
    address_route: string;
    address_sublocality: string;
    address_locality: string;
    address_admin_area_level_1: string;
    address_admin_area_level_2: string;
    address_country: string;
    address_postal_code: string;
    address_formatted_address: string;
    owner_name: string;
    cc_email: string;
}

export interface PipedriveLead {
    id: string;
    title: string;
    owner_id: number;
    creator_id: number;
    label_ids: string[];
    person_id: string;
    organization_id: string;
    source_name: string;
    is_archived: boolean;
    was_seen: boolean;
    value: { amount: number; currency: string };
    expected_close_date: null;
    next_activity_id: number;
    add_time: Date;
    update_time: Date;
    visible_to: string;
    cc_email: string;
    person: Partial<PipedrivePerson>;
    organization: Partial<PipedriveOrganization>;
}

export function toSalesforceLead(unifiedLead: UnifiedLead): SalesforceLead {
    const salesforceLead: any = {};

    // Map common fields
    salesforceLead.Id = unifiedLead.remoteId;
    salesforceLead.LastName = unifiedLead.lastName;
    salesforceLead.FirstName = unifiedLead.firstName;
    salesforceLead.Phone = unifiedLead.phone;
    salesforceLead.Email = unifiedLead.email;

    // Map custom fields
    if (unifiedLead.additional) {
        Object.keys(unifiedLead.additional).forEach((key) => {
            salesforceLead[key] = unifiedLead.additional?.[key];
        });
    }

    return salesforceLead as SalesforceLead;
}

export function toZohoLead(unifiedLead: UnifiedLead): ZohoLead {
    const zohoLead: any = {
        data: [{}],
        apply_feature_execution: [
            {
                name: 'layout_rules',
            },
        ],
        trigger: ['approval', 'workflow', 'blueprint'],
    };
    zohoLead.data[0].Id = unifiedLead.remoteId;
    zohoLead.data[0].First_Name = unifiedLead.firstName;
    zohoLead.data[0].Last_Name = unifiedLead.lastName;
    zohoLead.data[0].Email = unifiedLead.email;
    zohoLead.data[0].Phone = unifiedLead.phone;

    // Map custom fields
    if (unifiedLead.additional) {
        Object.keys(unifiedLead.additional).forEach((key) => {
            zohoLead.data[0][key] = unifiedLead.additional?.[key];
        });
    }

    return zohoLead;
}

export function toHubspotLead(lead: UnifiedLead): Partial<HubspotLead> {
    const hubspotLead: any = {
        properties: {
            firstname: lead.firstName,
            lastname: lead.lastName,
            email: lead.email,
            company: lead.additional?.company,
            phone: lead.phone,
            city: lead.additional?.address?.city,
            state: lead.additional?.address?.state,
            zip: lead.additional?.address?.zipCode,
            country: lead.additional?.address?.country,
            website: lead.additional?.website,
            hs_lead_source: lead.additional?.leadSource!,
            hs_lead_status: lead.additional?.hs_lead_status || undefined,
        },
    };

    // Map custom fields
    if (lead.additional) {
        Object.keys(lead.additional).forEach((key) => {
            hubspotLead['properties'][key] = lead.additional?.[key];
        });
    }
    return hubspotLead;
}

export function toPipedriveLead(lead: UnifiedLead): Partial<PipedriveLead> {
    const pipedriveLead: Partial<PipedriveLead> = {
        id: lead.id,
        title: `${lead.firstName} ${lead.lastName}`,
        add_time: lead.createdTimestamp,
        update_time: lead.updatedTimestamp,
        ...(lead.leadType === 'PERSON' && {
            person_id: lead.leadTypeId,
        }),
        ...(lead.leadType === 'ORGANIZATION' && {
            organization_id: lead.leadTypeId,
        }),
    };

    // Map custom fields
    // if (lead.additional) {
    //     Object.keys(lead.additional).forEach((key) => {
    //         pipedriveLead[key] = lead.additional?.[key];
    //     });
    // }
    return pipedriveLead;
}

export function unifiedLeadToPipedrivePerson(lead: UnifiedLead): Partial<PipedrivePerson> {
    return {
        id: lead.leadTypeId,
        first_name: lead.firstName,
        last_name: lead.lastName,
        name: `${lead.firstName} ${lead.lastName}`,
        phone: [{ value: lead.phone, primary: true, label: 'personal' }],
        email: [{ value: lead.email, primary: true, label: 'personal' }],
        primary_email: lead.email,
    };
}

export function unifiedLeadToPipedriveOrganization(lead: UnifiedLead): Partial<PipedriveOrganization> {
    return {
        id: lead.leadTypeId,
        name: lead.firstName,
        cc_email: lead.email,
    };
}

export function disunifyLead(
    lead: UnifiedLead,
    integrationId: string
): Partial<SalesforceLead> | Partial<HubspotLead> | Partial<ZohoLead> | Partial<PipedriveLead> | {} {
    if (integrationId === TP_ID.sfdc) {
        return toSalesforceLead(lead);
    } else if (integrationId === TP_ID.hubspot) {
        return toHubspotLead(lead);
    } else if (integrationId === TP_ID.zohocrm) {
        return toZohoLead(lead);
    } else if (integrationId === TP_ID.pipedrive) {
        return toPipedriveLead(lead);
    } else return {};
}
