export interface UnifiedOffer {
    id: string;
    version: number;
    application_id: string;
    job_id: string;
    candidate_id: string;
    opening: Opening;
    created_at: Date;
    updated_at: Date;
    sent_at: string;
    resolved_at: Date;
    starts_at: string;
    status: string;
    additional: any;
}

export interface Opening {
    id: string;
    opening_id: string;
    status: string;
    opened_at: Date;
    closed_at: Date;
    application_id: string;
    close_reason: CloseReason;
}

interface CloseReason {
    id: string;
    name: string;
}
