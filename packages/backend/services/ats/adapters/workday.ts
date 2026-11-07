import axios, { AxiosInstance } from 'axios';
import { UnifiedJob } from '../../../models/unified/job';
import { UnifiedCandidate } from '../../../models/unified/candidate';

export interface WorkdayConfig {
    apiToken: string;
    host?: string;
    tenant?: string;
    baseUrl?: string;
}

export class WorkdayAdapter {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor(config: WorkdayConfig) {
        const host = config.host || 'workday.com';
        const tenant = config.tenant || 'default';
        this.baseUrl = config.baseUrl || `https://${host}/ccx/api/recruiting/v1/${tenant}`;

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
     * Map Workday raw job posting to UnifiedJob
     */
    public mapJob(raw: any): UnifiedJob {
        const id = String(raw.id || raw.jobPostingId || raw.requisitionId || '');
        const departments = raw.supervisoryOrganization
            ? [
                  {
                      id: String(raw.supervisoryOrganization.id || ''),
                      name: String(raw.supervisoryOrganization.name || ''),
                  },
              ]
            : [];

        const offices = raw.primaryLocation
            ? [
                  {
                      id: String(raw.primaryLocation.id || id),
                      name: String(raw.primaryLocation.name || ''),
                      location: { name: String(raw.primaryLocation.name || '') },
                      parent_id: '',
                      child_ids: null,
                      external_id: String(raw.primaryLocation.id || ''),
                  },
              ]
            : [];

        return {
            id,
            name: raw.jobPostingTitle || raw.title || raw.name || '',
            requisition_id: raw.requisitionId || raw.code || id,
            notes: raw.description || raw.jobDescription || '',
            confidential: Boolean(raw.confidential),
            status: raw.status || (raw.active ? 'open' : 'closed'),
            created_at: raw.postedDate ? new Date(raw.postedDate) : new Date(),
            opened_at: raw.startDate ? new Date(raw.startDate) : new Date(),
            closed_at: raw.endDate ? new Date(raw.endDate) : (null as any),
            updated_at: raw.modifiedDate ? new Date(raw.modifiedDate) : new Date(),
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
     * Map Workday raw candidate to UnifiedCandidate
     */
    public mapCandidate(raw: any): UnifiedCandidate {
        const id = String(raw.id || raw.candidateId || '');
        const firstName =
            raw.legalName?.firstName || raw.preferredName?.firstName || raw.firstName || '';
        const lastName =
            raw.legalName?.lastName || raw.preferredName?.lastName || raw.lastName || '';

        const emailAddresses = raw.primaryEmail
            ? [{ value: String(raw.primaryEmail), type: 'primary' }]
            : raw.emails?.map((e: any) => ({ value: String(e.emailAddress || e), type: 'work' })) || [];

        const phoneNumbers = raw.primaryPhone
            ? [{ value: String(raw.primaryPhone), type: 'primary' }]
            : raw.phones?.map((p: any) => ({ value: String(p.phoneNumber || p), type: 'mobile' })) || [];

        const addresses = raw.primaryAddress
            ? [{ value: String(raw.primaryAddress.formattedAddress || raw.primaryAddress), type: 'primary' }]
            : [];

        const applications = [
            {
                id: id,
                candidate_id: id,
                prospect: false,
                applied_at: raw.createdDate || raw.applicationDate || new Date().toISOString(),
                rejected_at: raw.status === 'Rejected' ? raw.statusDate || '' : '',
                last_activity_at: raw.statusDate || raw.createdDate || '',
                location: { address: raw.primaryAddress?.city || '' },
                source: { id: raw.source || '', public_name: raw.source || '' },
                credited_to: { id: '', first_name: '', last_name: '', name: '', employee_id: '' },
                rejection_reason: raw.rejectionReason || '',
                rejection_details: '',
                jobs: [],
                job_post_id: raw.jobPostingId || '',
                status: raw.stage || raw.status || 'applied',
                current_stage: { id: raw.stage || 'review', name: raw.stage || 'Review' },
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
            company: raw.currentCompany || '',
            title: raw.currentTitle || raw.headline || '',
            created_at: raw.createdDate ? new Date(raw.createdDate) : new Date(),
            updated_at: raw.modifiedDate ? new Date(raw.modifiedDate) : new Date(),
            last_activity: raw.modifiedDate ? new Date(raw.modifiedDate) : new Date(),
            is_private: false,
            photo_url: raw.photoUrl || '',
            application_ids: [id],
            can_email: true,
            tags: raw.tags || [],
            attachments: [],
            phone_numbers: phoneNumbers,
            addresses: addresses,
            email_addresses: emailAddresses,
            website_addresses: [],
            social_media_addresses: [],
            recruiter: { id: '', first_name: '', last_name: '', name: '', employee_id: '', responsible: false },
            coordinator: { id: '', first_name: '', last_name: '', name: '', employee_id: '', responsible: false },
            applications: applications as any,
            additional: raw,
        };
    }

    /**
     * Fetch job posting by ID
     */
    public async getJob(jobId: string): Promise<UnifiedJob> {
        const response = await this.client.get(`/jobPostings/${jobId}`);
        return this.mapJob(response.data);
    }

    /**
     * Fetch list of job postings
     */
    public async getJobs(params?: { limit?: number; offset?: number }): Promise<{
        results: UnifiedJob[];
        total?: number;
    }> {
        const response = await this.client.get('/jobPostings', { params });
        const items = response.data?.data || response.data?.jobPostings || response.data || [];
        const jobs = items.map((j: any) => this.mapJob(j));
        return {
            results: jobs,
            total: response.data?.total || jobs.length,
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
    public async getCandidates(params?: { limit?: number; offset?: number }): Promise<{
        results: UnifiedCandidate[];
        total?: number;
    }> {
        const response = await this.client.get('/candidates', { params });
        const items = response.data?.data || response.data?.candidates || response.data || [];
        const candidates = items.map((c: any) => this.mapCandidate(c));
        return {
            results: candidates,
            total: response.data?.total || candidates.length,
        };
    }

    /**
     * Create candidate in Workday
     */
    public async createCandidate(candidateData: any): Promise<UnifiedCandidate> {
        const response = await this.client.post('/candidates', candidateData);
        return this.mapCandidate(response.data);
    }
}
