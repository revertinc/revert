// Add this interface to all pipedrive get calls
export interface PipedrivePagination {
    additional_data: {
        pagination: {
            start: number;
            limit: number;
            next_start: number;
            more_items_in_collection: boolean;
        };
    };
}

export enum PipedriveDealStatus {
    won = 'won',
    open = 'open',
    lost = 'lost',
    deleted = 'deleted',
}

export interface PipedriveContact {
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
    update_time: Date;
    add_time: Date;
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

export interface PipedriveCompany {
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
    person: Partial<PipedriveContact>;
    organization: Partial<PipedriveCompany>;
}

export interface PipedriveDeal {
    id: string;
    creator_user_id: {
        id: string;
        name: string;
        email: string;
        has_pic: boolean;
        active_flag: boolean;
        value: number;
    };
    user_id: {
        id: string;
        name: string;
        email: string;
        has_pic: boolean;
        active_flag: boolean;
        value: string;
    };
    person_id: {
        active_flag: boolean;
        name: string;
        email: { label: string; value: string; primary: boolean }[];
        phone: { label: string; value: string; primary: boolean }[];
        value: string;
    };
    org_id: {
        name: string;
        people_count: number;
        owner_id: string;
        address: string;
        active_flag: boolean;
        cc_email: string;
        value: string;
    };
    stage_id: string;
    title: string;
    value: number;
    currency: string;
    add_time: Date;
    update_time: Date;
    stage_change_time: Date;
    active: boolean;
    deleted: boolean;
    status: string;
    probability: number;
    next_activity_date: string;
    next_activity_time: string;
    next_activity_id: string;
    last_activity_id: string;
    last_activity_date: string;
    lost_reason: string;
    visible_to: string;
    close_time: Date;
    pipeline_id: string;
    won_time: Date;
    first_won_time: Date;
    lost_time: string;
    products_count: number;
    files_count: number;
    notes_count: number;
    followers_count: number;
    email_messages_count: number;
    activities_count: number;
    done_activities_count: number;
    undone_activities_count: number;
    participants_count: number;
    expected_close_date: string;
    last_incoming_mail_time: string;
    last_outgoing_mail_time: string;
    label: string;
    stage_order_nr: number;
    person_name: string;
    org_name: string;
    next_activity_subject: string;
    next_activity_type: string;
    next_activity_duration: string;
    next_activity_note: string;
    formatted_value: string;
    weighted_value: string;
    formatted_weighted_value: string;
    weighted_value_currency: string;
    rotten_time: string;
    owner_name: string;
    cc_email: string;
    org_hidden: boolean;
    person_hidden: boolean;
    // average_time_to_won: { y: 0; m: 0; d: 0; h: 0; i: 20; s: 49; total_seconds: 1249 };
    // average_stage_progress: 4.99;
    // age: { y: 0; m: 6; d: 14; h: 8; i: 57; s: 26; total_seconds: 17139446 };
    // stay_in_pipeline_stages: {
    //     times_in_stages: { '1': 15721267; '2': 1288449; '3': 4368; '4': 3315; '5': 26460 };
    //     order_of_stages: [1, 2, 3, 4, 5];
    // };
    last_activity: any;
    next_activity: any;
}

export interface PipedriveEvent {
    id: string;
    company_id: string;
    user_id: string;
    done: boolean;
    type: string;
    reference_type: string;
    reference_id: string;
    conference_meeting_client: string;
    conference_meeting_url: string;
    conference_meeting_id: string;
    due_date: string;
    due_time: string;
    duration: string;
    busy_flag: boolean;
    add_time: Date;
    marked_as_done_time: Date;
    last_notification_time: Date;
    last_notification_user_id: string;
    notification_language_id: string;
    subject: string;
    public_description: string;
    calendar_sync_include_context: string;
    location: string;
    org_id: string;
    person_id: string;
    deal_id: string;
    lead_id: string;
    project_id: string;
    active_flag: boolean;
    update_time: Date;
    update_user_id: string;
    gcal_event_id: string;
    google_calendar_id: string;
    google_calendar_etag: string;
    source_timezone: string;
    rec_rule: string;
    rec_rule_extension: string;
    rec_master_activity_id: string;
    series: any[];
    note: string;
    created_by_user_id: string;
    location_subpremise: string;
    location_street_number: string;
    location_route: string;
    location_sublocality: string;
    location_locality: string;
    location_admin_area_level_1: string;
    location_admin_area_level_2: string;
    location_country: string;
    location_postal_code: string;
    location_formatted_address: string;
    attendees: {
        email_address: string;
        is_organizer: any;
        name: string;
        person_id: string;
        status: string;
        user_id: string;
    }[];
    participants: { person_id: string; primary_flag: boolean }[];
    org_name: string;
    person_name: string;
    deal_title: string;
    owner_name: string;
    person_dropbox_bcc: string;
    deal_dropbox_bcc: string;
    assigned_to_user_id: string;
    file: {
        id: string;
        clean_name: string;
        url: string;
    };
}

export interface PipedriveNote {
    id: string;
    active_flag: boolean;
    add_time: Date;
    content: string;
    deal: { title: string };
    lead_id: string;
    deal_id: string;
    last_update_user_id: string;
    org_id: string;
    organization: { name: string };
    person: { name: string };
    person_id: string;
    pinned_to_lead_flag: boolean;
    pinned_to_deal_flag: boolean;
    pinned_to_organization_flag: boolean;
    pinned_to_person_flag: boolean;
    update_time: Date;
    user: {
        email: string;
        icon_url: string;
        is_you: boolean;
        name: string;
    };
    user_id: string;
}

export interface PipedriveTask extends PipedriveEvent {}

export interface PipedriveUser {
    id: string;
    name: string;
    default_currency: string;
    locale: string;
    lang: string;
    email: string;
    phone: string;
    activated: boolean;
    last_login: Date;
    created: Date;
    modified: Date;
    has_created_company: boolean;
    access: { app: string; admin: boolean; permission_set_id: string }[];
    active_flag: boolean;
    timezone_name: string;
    timezone_offset: string;
    role_id: string;
    icon_url: string;
    is_you: boolean;
}
