/**
 * Workday Unified ATS Integration for Revert (packages/backend)
 * Bounty: revertinc/revert #372 ([REVER-48] Workday Integration — $100 USD)
 *
 * Implements Workday Recruiting REST API v1 + OAuth 2.0 Refresh Token flow
 * (`https://{host}/ccx/api/v1/{tenant}`) and normalizes Workday Job Requisitions
 * and Candidates into Revert's Unified ATS schema.
 */

export interface WorkdayConnectionConfig {
  host: string; // e.g. "wd5-services1.myworkday.com"
  tenant: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
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

export class WorkdayAtsService {
  private readonly host: string;
  private readonly tenant: string;
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private readonly refreshToken?: string;
  private accessToken?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: WorkdayConnectionConfig) {
    if (!config.host || !config.tenant) {
      throw new Error('WorkdayAtsService requires both host and tenant');
    }
    this.host = config.host.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    this.tenant = config.tenant;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.refreshToken = config.refreshToken;
    this.accessToken = config.accessToken;
    this.fetchImpl = config.fetchImpl || globalThis.fetch;
  }

  get baseUrl(): string {
    return `https://${this.host}/ccx/api/v1/${encodeURIComponent(this.tenant)}`;
  }

  async ensureAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;
    if (!this.clientId || !this.clientSecret || !this.refreshToken) {
      throw new Error('WorkdayAtsService requires accessToken or OAuth2 clientId/clientSecret/refreshToken');
    }

    const tokenUrl = `https://${this.host}/ccx/oauth2/${encodeURIComponent(this.tenant)}/token`;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const res = await this.fetchImpl(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: body.toString(),
    });

    const data = (await res.json().catch(() => ({}))) as { access_token?: string; error_description?: string };
    if (!res.ok || !data.access_token) {
      throw new Error(data.error_description || `Workday OAuth2 Error (${res.status})`);
    }
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  private async request<T = Record<string, unknown>>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const token = await this.ensureAccessToken();
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        (data as { error?: string })?.error || `Workday API Error (${res.status} on ${method} ${path})`
      );
    }
    return data as T;
  }

  static mapJobStatus(status?: string): UnifiedAtsJob['status'] {
    switch ((status || '').toLowerCase()) {
      case 'open':
      case 'posted':
        return 'OPEN';
      case 'closed':
      case 'filled':
        return 'CLOSED';
      case 'draft':
        return 'DRAFT';
      case 'frozen':
      case 'archived':
        return 'ARCHIVED';
      default:
        return 'OPEN';
    }
  }

  static toUnifiedJob(raw: Record<string, any>): UnifiedAtsJob {
    const id = String(raw.id || raw.jobRequisitionId || '');
    return {
      id,
      remoteId: id,
      title: String(raw.descriptor || raw.title || raw.jobPostingTitle || ''),
      shortcode: String(raw.jobRequisitionId || raw.id || ''),
      status: WorkdayAtsService.mapJobStatus(raw.status?.descriptor || raw.state),
      department: raw.supervisoryOrganization?.descriptor || raw.department || undefined,
      location: raw.primaryLocation?.descriptor || raw.location || undefined,
      url: raw.externalApplyUrl || raw.url || undefined,
      createdAt: raw.recruitingStartDate || raw.createdAt || undefined,
      raw,
    };
  }

  static toUnifiedCandidate(raw: Record<string, any>): UnifiedAtsCandidate {
    const id = String(raw.id || raw.candidateId || '');
    const firstName = String(raw.name?.givenName || raw.firstName || '');
    const lastName = String(raw.name?.familyName || raw.lastName || '');
    return {
      id,
      remoteId: id,
      firstName,
      lastName,
      name: String(raw.descriptor || raw.name?.formatted || `${firstName} ${lastName}`.trim()),
      email: raw.email || raw.contactData?.emailAddress || undefined,
      phone: raw.phone || raw.contactData?.phoneNumber || undefined,
      stage: raw.jobApplication?.stage?.descriptor || raw.stage || undefined,
      jobShortcode: raw.jobApplication?.jobRequisition?.id || raw.jobRequisitionId || undefined,
      disqualified: Boolean(raw.disqualified || raw.declined),
      createdAt: raw.createdOn || raw.createdAt || undefined,
      updatedAt: raw.updatedOn || raw.updatedAt || undefined,
      raw,
    };
  }

  async listJobs(params: { limit?: number; offset?: number } = {}): Promise<UnifiedAtsJob[]> {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const data = await this.request<{ data?: Array<Record<string, any>> }>(`/jobRequisitions${qs}`, 'GET');
    return (data.data || []).map(WorkdayAtsService.toUnifiedJob);
  }

  async listCandidates(params: { limit?: number; offset?: number } = {}): Promise<UnifiedAtsCandidate[]> {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const data = await this.request<{ data?: Array<Record<string, any>> }>(`/candidates${qs}`, 'GET');
    return (data.data || []).map(WorkdayAtsService.toUnifiedCandidate);
  }

  async createCandidate(input: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    jobRequisitionId?: string;
  }): Promise<UnifiedAtsCandidate> {
    const payload = {
      name: {
        givenName: input.firstName,
        familyName: input.lastName,
      },
      contactData: {
        emailAddress: input.email,
        ...(input.phone ? { phoneNumber: input.phone } : {}),
      },
      ...(input.jobRequisitionId
        ? { jobApplication: { jobRequisition: { id: input.jobRequisitionId } } }
        : {}),
    };
    const data = await this.request<Record<string, any>>('/candidates', 'POST', payload);
    return WorkdayAtsService.toUnifiedCandidate(data);
  }
}
