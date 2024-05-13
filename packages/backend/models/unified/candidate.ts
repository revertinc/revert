import { UnifiedJob } from './job';

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
    applications: applications[];
    company: string;
    title: string;
    additional: any;
}

interface applications {
    id: number;
    candidate_id: number;
    prospect: boolean;
    applied_at: string;
    rejected_at: string;
    last_activity_at: string;
    location: { address: string };
    source: { id: number; public_name: string };
    credited_to: { id: number; first_name: string; last_name: string; name: string; employee_id: string };
    rejection_reason: string;
    rejection_details: string;
    jobs: UnifiedJob;
    job_post_id: number;
    status: string;
    current_stage: {
        id: number;
        name: string;
    };
    answers: {
        question: string;
        answer: string;
    }[];
    prospective_office: string;
    prospective_department: string;
    prospect_detail: {
        prospect_pool: string;
        prospect_stage: string;
        prospect_owner: string;
    };
    custom_fields: {
        application_custom_test: string;
    };
    keyed_custom_fields: {
        application_custom_test: { name: string; type: string; value: string };
    };
    attachments: { filename: string; url: string; type: string; created_at: Date };
}
