export interface UnifiedCandidate {
    id: string;
    created_at: Date;
    modified_at: Date;
    first_name: string;
    last_name: string;
    last_interaction_at: Date;
    is_private: boolean;
    can_email: boolean;
    location: {
        name: string;
    }[];
    phone_numbers: { value: string }[];
    email_addresses: { value: string }[];
    tags: string[];
    attachments: { filename: string; url: string; type: string; created_at: Date }[];
    applications: any[];
    company: string;
    title: string;
    additional: any;
}
