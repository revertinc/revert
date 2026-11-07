import axios, { AxiosInstance } from 'axios';
import { UnifiedJob } from '../../../models/unified/job';
import { UnifiedCandidate } from '../../../models/unified/candidate';

export interface WorkableConfig {
    apiToken: string;
    subdomain?: string;
    baseUrl?: string;
}

export class WorkableAdapter {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor(config: WorkableConfig) {
        const subdomain = config.subdomain || 'api';
        this.baseUrl = config.baseUrl || `https://${subdomain}.workable.com/spi/v3`;

        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                Authorization: `Bearer ${config.apiToken}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Map Workable raw job to UnifiedJob
     */
    public mapJob(raw: any): UnifiedJob {
        const id = String(raw.id || raw.shortcode || '');
        const departments = raw.department
            ? [{ id: String(raw.department), name: String(raw.department) }]
            : [];

        const offices = raw.location
            ? [
                  {
                      id: String(raw.location.city || raw.location.country || id),
                      name: String(raw.location.city || raw.location.country || ''),
                      location: {
                          name: String(
                              [raw.location.address, raw.location.city, raw.location.country]
                                  .filter(Boolean)
                                  .join(', ') || raw.location.city || '',
                          ),
                      },
                      parent_id: '',
                      child_ids: null,
                      external_id: String(raw.location.country_code || ''),
                  },
              ]
            : [];

        return {
            id,
            name: raw.title || '',
            requisition_id: raw.code || raw.shortcode || id,
            notes: raw.description || '',
            confidential: false,
            status: raw.state || 'published',
            created_at: raw.created_at ? new Date(raw.created_at) : new Date(),
            opened_at: raw.created_at ? new Date(raw.created_at) : new Date(),
            closed_at: raw.closed_at ? new Date(raw.closed_at) : (null as any),
            updated_at: raw.updated_at ? new Date(raw.updated_at) : new Date(),
            is_template: false,
            copied_from_id: null,
            departments: departments as any,
            offices: offices as any,
            openings: [],
            hiring_team: {
                hiring_managers: [],
                recruiters: [],
                coordinators: [],
                sourcers: [],
            },
            additional: raw,
        };
    }

    /**
     * Map Workable raw candidate to UnifiedCandidate
     */
    public mapCandidate(raw: any): UnifiedCandidate {
        const id = String(raw.id || '');
        const firstName = raw.firstname || raw.name?.split(' ')[0] || '';
        const lastName = raw.lastname || raw.name?.split(' ').slice(1).join(' ') || '';

        const emailAddresses = raw.email
            ? [{ value: String(raw.email), type: 'work' }]
            : [];

        const phoneNumbers = raw.phone
            ? [{ value: String(raw.phone), type: 'mobile' }]
            : [];

        const addresses = raw.address
            ? [{ value: String(raw.address), type: 'home' }]
            : [];

        const websiteAddresses = raw.website
            ? [{ value: String(raw.website), type: 'personal' }]
            : [];

        const socialMediaAddresses = [
            raw.linkedin_url ? { value: String(raw.linkedin_url), type: 'linkedin' } : null,
            raw.github_url ? { value: String(raw.github_url), type: 'github' } : null,
        ].filter(Boolean) as any[];

        const applications = [
            {
                id: id,
                candidate_id: id,
                prospect: false,
                applied_at: raw.created_at || new Date().toISOString(),
                rejected_at: raw.disqualified ? raw.updated_at : '',
                last_activity_at: raw.updated_at || raw.created_at || '',
                location: { address: raw.address || '' },
                source: { id: raw.source || '', public_name: raw.source || '' },
                credited_to: { id: '', first_name: '', last_name: '', name: '', employee_id: '' },
                rejection_reason: raw.disqualification_reason || '',
                rejection_details: '',
                jobs: raw.job ? [this.mapJob(raw.job)] : [],
                job_post_id: raw.job?.shortcode || '',
                status: raw.stage || (raw.disqualified ? 'rejected' : 'active'),
                current_stage: { id: raw.stage || 'initial', name: raw.stage || 'Initial' },
                answers: [],
                prospective_office: '',
                prospective_department: '',
                prospect_detail: { prospect_pool: '', prospect_stage: '', prospect_owner: '' },
                custom_fields: { application_custom_test: '' },
                keyed_custom_fields: {
                    application_custom_test: { name: '', type: '', value: '' },
                },
                attachments: [],
            },
        ];

        return {
            id,
            first_name: firstName,
            last_name: lastName,
            company: raw.company || '',
            title: raw.headline || '',
            created_at: raw.created_at ? new Date(raw.created_at) : new Date(),
            updated_at: raw.updated_at ? new Date(raw.updated_at) : new Date(),
            last_activity: raw.updated_at ? new Date(raw.updated_at) : new Date(),
            is_private: false,
            photo_url: raw.image_url || '',
            application_ids: [id],
            can_email: true,
            tags: raw.tags || [],
            attachments: [],
            phone_numbers: phoneNumbers,
            addresses: addresses,
            email_addresses: emailAddresses,
            website_addresses: websiteAddresses,
            social_media_addresses: socialMediaAddresses,
            recruiter: { id: '', first_name: '', last_name: '', name: '', employee_id: '', responsible: false },
            coordinator: { id: '', first_name: '', last_name: '', name: '', employee_id: '', responsible: false },
            applications: applications as any,
            additional: raw,
        };
    }

    /**
     * Fetch job by ID or shortcode
     */
    public async getJob(jobId: string): Promise<UnifiedJob> {
        const response = await this.client.get(`/jobs/${jobId}`);
        return this.mapJob(response.data);
    }

    /**
     * Fetch list of jobs
     */
    public async getJobs(params?: { limit?: number; since_id?: string; state?: string }): Promise<{
        results: UnifiedJob[];
        nextCursor?: string;
    }> {
        const response = await this.client.get('/jobs', { params });
        const jobs = (response.data?.jobs || response.data || []).map((j: any) => this.mapJob(j));
        const paging = response.data?.paging;
        return {
            results: jobs,
            nextCursor: paging?.next,
        };
    }

    /**
     * Fetch candidate by ID
     */
    public async getCandidate(candidateId: string): Promise<UnifiedCandidate> {
        const response = await this.client.get(`/candidates/${candidateId}`);
        return this.mapCandidate(response.data);
    }

    /**
     * Fetch list of candidates
     */
    public async getCandidates(params?: { limit?: number; since_id?: string; stage?: string }): Promise<{
        results: UnifiedCandidate[];
        nextCursor?: string;
    }> {
        const response = await this.client.get('/candidates', { params });
        const candidates = (response.data?.candidates || response.data || []).map((c: any) =>
            this.mapCandidate(c),
        );
        const paging = response.data?.paging;
        return {
            results: candidates,
            nextCursor: paging?.next,
        };
    }

    /**
     * Create candidate for a job
     */
    public async createCandidate(jobShortcode: string, candidateData: any): Promise<UnifiedCandidate> {
        const response = await this.client.post(`/jobs/${jobShortcode}/candidates`, {
            candidate: candidateData,
        });
        return this.mapCandidate(response.data?.candidate || response.data);
    }
}
