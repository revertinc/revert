import { UnifiedJob } from './job';

export interface UnifiedCandidate {
    id: string;
    first_name: string;
    last_name: string;
    company: string;
    title: string;
    created_at: Date;
    updated_at: Date;
    last_activity: Date;
    is_private: boolean;
    photo_url: string;
    application_ids: string[];
    can_email: boolean;
    tags: string[];
    attachments: Attachment[];
    phone_numbers: CandidateValueTypePair[];
    addresses: CandidateValueTypePair[];
    email_addresses: CandidateValueTypePair[];
    website_addresses: CandidateValueTypePair[];
    social_media_addresses: CandidateValueTypePair[];
    recruiter: HiringTeamInstance;
    coordinator: HiringTeamInstance;
    applications: Application[];
    additional: any;
}

interface Attachment {
    filename: string;
    url: string;
    type: string;
    created_at: Date;
}

interface CandidateValueTypePair {
    value: string;
    type: string;
}
interface HiringTeamInstance {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    employee_id: string;
    responsible: boolean;
}
interface Application {
    id: string;
    candidate_id: string;
    prospect: boolean;
    applied_at: string;
    rejected_at: string;
    last_activity_at: string;
    location: LocationSchema;
    source: SourceSchema;
    credited_to: CreditedToSchema;
    rejection_reason: string;
    rejection_details: string;
    jobs: UnifiedJob[];
    job_post_id: string;
    status: string;
    current_stage: CurrentStageSchema;
    answers: AnswerSchema[];
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
        application_custom_test: ApplicationCustomTestKeyedSchema;
    };
    attachments: Attachment[];
}

interface ApplicationCustomTestKeyedSchema {
    name: string;
    type: string;
    value: string;
}
interface AnswerSchema {
    question: string;
    answer: string;
}
interface CurrentStageSchema {
    id: string;
    name: string;
}

interface LocationSchema {
    address: string;
}

interface SourceSchema {
    id: string;
    public_name: string;
}
interface CreditedToSchema {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    employee_id: string;
}
