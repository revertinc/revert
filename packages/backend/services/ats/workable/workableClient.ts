/**
 * Workable ATS SPI v3 Client & Unified Revert Model Mappers (#551).
 * Docs: https://workable.readme.io/reference/generate-an-access-token
 */

export interface WorkableClientConfig {
    subdomain: string;
    accessToken: string;
    fetchImpl?: typeof fetch;
}

export interface UnifiedJob {
    id: string;
    name: string;
    description: string;
    code: string;
    status: string;
    department: string;
    location: string;
    createdAt: string;
    remoteData: Record<string, unknown>;
}

export interface UnifiedCandidate {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    jobShortcode: string;
    stage: string;
    createdAt: string;
    remoteData: Record<string, unknown>;
}

export interface UnifiedDepartment {
    id: string;
    name: string;
    remoteData: Record<string, unknown>;
}

export interface PaginatedResult<T> {
    results: T[];
    next?: string;
}

export function buildWorkableBaseUrl(subdomain: string): string {
    const clean = (subdomain || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!clean) {
        throw new Error('Workable subdomain is required (e.g. "acme" for acme.workable.com).');
    }
    return `https://${clean}.workable.com/spi/v3`;
}

export function mapWorkableJob(raw: Record<string, any>): UnifiedJob {
    const loc = raw.location || {};
    const locationStr = [loc.city, loc.region, loc.country].filter(Boolean).join(', ');
    return {
        id: String(raw.shortcode || raw.id || ''),
        name: String(raw.title || raw.full_title || ''),
        description: String(raw.description || ''),
        code: String(raw.code || raw.shortcode || ''),
        status: String(raw.state || 'draft'),
        department: String(raw.department || ''),
        location: locationStr,
        createdAt: String(raw.created_at || ''),
        remoteData: raw,
    };
}

export function mapWorkableCandidate(raw: Record<string, any>): UnifiedCandidate {
    return {
        id: String(raw.id || ''),
        firstName: String(raw.firstname || raw.first_name || ''),
        lastName: String(raw.lastname || raw.last_name || ''),
        email: String(raw.email || ''),
        phone: String(raw.phone || ''),
        jobShortcode: String(raw.job?.shortcode || ''),
        stage: String(raw.stage || ''),
        createdAt: String(raw.created_at || ''),
        remoteData: raw,
    };
}

export function mapWorkableDepartment(raw: Record<string, any>): UnifiedDepartment {
    return {
        id: String(raw.id || raw.name || ''),
        name: String(raw.name || ''),
        remoteData: raw,
    };
}

export class WorkableATSClient {
    private readonly baseUrl: string;
    private readonly accessToken: string;
    private readonly fetchImpl: typeof fetch;

    constructor(config: WorkableClientConfig) {
        this.baseUrl = buildWorkableBaseUrl(config.subdomain);
        if (!config.accessToken || !config.accessToken.trim()) {
            throw new Error('Workable accessToken is required.');
        }
        this.accessToken = config.accessToken.trim();
        this.fetchImpl = config.fetchImpl || fetch;
    }

    private async request<T>(pathOrUrl: string, init: RequestInit = {}): Promise<T> {
        const url = /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${this.baseUrl}${pathOrUrl}`;
        const resp = await this.fetchImpl(url, {
            ...init,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...(init.headers || {}),
            },
        });
        if (!resp.ok) {
            const errBody = await resp.text();
            throw new Error(`Workable API error (${resp.status}): ${errBody}`);
        }
        return (await resp.json()) as T;
    }

    async listJobs(state?: 'published' | 'closed' | 'draft' | 'archived'): Promise<PaginatedResult<UnifiedJob>> {
        const qs = state ? `?state=${encodeURIComponent(state)}` : '';
        const data = await this.request<{ jobs?: Record<string, any>[]; paging?: { next?: string } }>(`/jobs${qs}`);
        return {
            results: (data.jobs || []).map(mapWorkableJob),
            next: data.paging?.next,
        };
    }

    async getJob(shortcode: string): Promise<UnifiedJob> {
        const data = await this.request<Record<string, any>>(`/jobs/${encodeURIComponent(shortcode)}`);
        return mapWorkableJob(data);
    }

    async listCandidates(shortcode?: string): Promise<PaginatedResult<UnifiedCandidate>> {
        const path = shortcode ? `/jobs/${encodeURIComponent(shortcode)}/candidates` : '/candidates';
        const data = await this.request<{ candidates?: Record<string, any>[]; paging?: { next?: string } }>(path);
        return {
            results: (data.candidates || []).map(mapWorkableCandidate),
            next: data.paging?.next,
        };
    }

    async getCandidate(candidateId: string): Promise<UnifiedCandidate> {
        const data = await this.request<{ candidate?: Record<string, any> }>(
            `/candidates/${encodeURIComponent(candidateId)}`
        );
        return mapWorkableCandidate(data.candidate || data);
    }

    async createCandidate(
        shortcode: string,
        candidate: { firstname: string; lastname: string; email: string; phone?: string; sourced?: boolean }
    ): Promise<UnifiedCandidate> {
        const data = await this.request<{ candidate?: Record<string, any> }>(
            `/jobs/${encodeURIComponent(shortcode)}/candidates`,
            {
                method: 'POST',
                body: JSON.stringify({
                    sourced: candidate.sourced ?? true,
                    candidate: {
                        firstname: candidate.firstname,
                        lastname: candidate.lastname,
                        email: candidate.email,
                        phone: candidate.phone,
                    },
                }),
            }
        );
        return mapWorkableCandidate(data.candidate || data);
    }

    async listDepartments(): Promise<UnifiedDepartment[]> {
        const data = await this.request<{ departments?: Record<string, any>[] }>('/departments');
        return (data.departments || []).map(mapWorkableDepartment);
    }
}
