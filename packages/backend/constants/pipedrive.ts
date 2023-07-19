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
    person: Partial<PipedriveContact>;
    organization: Partial<PipedriveOrganization>;
}
