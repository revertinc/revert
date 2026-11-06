/**
 * Workable Unified ATS Integration for Revert (packages/backend)
 * Bounty: revertinc/revert #551 ([REVER-51] Workable Integration — $100 USD)
 *
 * Implements Bearer token authentication, subdomain routing (`https://{subdomain}.workable.com/spi/v3`),
 * and normalized mappings between Workable API v3 and Revert's Unified ATS schema (Jobs & Candidates).
 */

export interface WorkableConnectionConfig {
  subdomain: string;
  accessToken: string;
  fetchImpl?: typeof fetch;
}

export interface UnifiedAtsJob {
  id: string;
  remoteId: string;
  title: string;
  shortcode: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT' | 'ARCHIVED';
  department?: string;
  location?: string;
  url?: string;
  createdAt?: string;
  raw: Record<string, unknown>;
}

export interface UnifiedAtsCandidate {
  id: string;
  remoteId: string;
  firstName: string;
  lastName: string;
  name: string;
  email?: string;
  phone?: string;
  stage?: string;
  jobShortcode?: string;
  disqualified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  raw: Record<string, unknown>;
}

export interface CreateWorkableCandidateInput {
  jobShortcode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  headline?: string;
  summary?: string;
  resumeUrl?: string;
  sourced?: boolean;
}

export class WorkableAtsService {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: WorkableConnectionConfig) {
    if (!config.subdomain || !config.accessToken) {
      throw new Error('WorkableAtsService requires both subdomain and accessToken');
    }
    this.baseUrl = `https://${config.subdomain}.workable.com/spi/v3`;
    this.accessToken = config.accessToken;
    this.fetchImpl = config.fetchImpl || globalThis.fetch;
  }

  private async request<T = Record<string, unknown>>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        (data as { error?: string })?.error || `Workable API Error (${res.status} on ${method} ${path})`
      );
    }
    return data as T;
  }

  static mapJobStatus(state?: string): UnifiedAtsJob['status'] {
    switch ((state || '').toLowerCase()) {
      case 'published':
        return 'OPEN';
      case 'closed':
        return 'CLOSED';
      case 'draft':
        return 'DRAFT';
      case 'archived':
        return 'ARCHIVED';
      default:
        return 'OPEN';
    }
  }

  static toUnifiedJob(raw: Record<string, any>): UnifiedAtsJob {
    return {
      id: String(raw.id || raw.shortcode),
      remoteId: String(raw.id || raw.shortcode),
      title: String(raw.title || ''),
      shortcode: String(raw.shortcode || ''),
      status: WorkableAtsService.mapJobStatus(raw.state),
      department: raw.department || undefined,
      location: raw.location?.location_str || raw.location?.city || undefined,
      url: raw.url || raw.application_url || undefined,
      createdAt: raw.created_at || undefined,
      raw,
    };
  }

  static toUnifiedCandidate(raw: Record<string, any>): UnifiedAtsCandidate {
    return {
      id: String(raw.id),
      remoteId: String(raw.id),
      firstName: String(raw.firstname || ''),
      lastName: String(raw.lastname || ''),
      name: String(raw.name || `${raw.firstname || ''} ${raw.lastname || ''}`.trim()),
      email: raw.email || undefined,
      phone: raw.phone || undefined,
      stage: raw.stage || undefined,
      jobShortcode: raw.job?.shortcode || undefined,
      disqualified: Boolean(raw.disqualified),
      createdAt: raw.created_at || undefined,
      updatedAt: raw.updated_at || undefined,
      raw,
    };
  }

  async listJobs(params: { state?: string; limit?: number } = {}): Promise<UnifiedAtsJob[]> {
    const query = new URLSearchParams();
    if (params.state) query.set('state', params.state);
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const data = await this.request<{ jobs?: Array<Record<string, any>> }>(`/jobs${qs}`, 'GET');
    return (data.jobs || []).map(WorkableAtsService.toUnifiedJob);
  }

  async listCandidates(params: { shortcode?: string; limit?: number } = {}): Promise<UnifiedAtsCandidate[]> {
    const query = new URLSearchParams();
    if (params.shortcode) query.set('shortcode', params.shortcode);
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const data = await this.request<{ candidates?: Array<Record<string, any>> }>(`/candidates${qs}`, 'GET');
    return (data.candidates || []).map(WorkableAtsService.toUnifiedCandidate);
  }

  async getCandidate(candidateId: string): Promise<UnifiedAtsCandidate> {
    const data = await this.request<{ candidate?: Record<string, any> }>(
      `/candidates/${encodeURIComponent(candidateId)}`,
      'GET'
    );
    return WorkableAtsService.toUnifiedCandidate(data.candidate || data);
  }

  async createCandidate(input: CreateWorkableCandidateInput): Promise<UnifiedAtsCandidate> {
    const payload = {
      sourced: input.sourced ?? true,
      candidate: {
        firstname: input.firstName,
        lastname: input.lastName,
        name: `${input.firstName} ${input.lastName}`.trim(),
        email: input.email,
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.headline ? { headline: input.headline } : {}),
        ...(input.summary ? { summary: input.summary } : {}),
        ...(input.resumeUrl ? { resume_url: input.resumeUrl } : {}),
      },
    };
    const data = await this.request<{ candidate?: Record<string, any> }>(
      `/jobs/${encodeURIComponent(input.jobShortcode)}/candidates`,
      'POST',
      payload
    );
    return WorkableAtsService.toUnifiedCandidate(data.candidate || data);
  }
}
