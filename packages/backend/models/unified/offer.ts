export interface UnifiedOffer {
    id: string;
    created_at: Date;
    modified_at: Date;
    application: string;
    closed_at: Date;
    sent_at: Date;
    start_date: Date;
    status: string;
    additional: any;
}
