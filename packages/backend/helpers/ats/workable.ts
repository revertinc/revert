export interface WorkableConfig {
    subdomain: string;
    accessToken: string;
    baseUrl?: string;
}

export interface UnifiedAtsJob {
    id: string;
    title: string;
    description: string;
    status: 'OPEN' | 'CLOSED' | 'DRAFT' | 'ARCHIVED';
    department?: string;
    location?: string;
    createdAt?: string;
    updatedAt?: string;
    remoteData: Record<string, any>;
}

export interface UnifiedAtsCandidate {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    stage?: string;
    jobId?: string;
    createdAt?: string;
    updatedAt?: string;
    remoteData: Record<string, any>;
}

export interface UnifiedAtsDepartment {
    id: string;
    name: string;
    remoteData: Record<string, any>;
}

export interface UnifiedAtsOffer {
    id: string;
    candidateId: string;
    jobId?: string;
    status: string;
    createdAt?: string;
    remoteData: Record<string, any>;
}

export function buildWorkableBaseUrl(subdomain: string, customBaseUrl?: string): string {
    if (customBaseUrl) {
        return customBaseUrl.replace(/\/+$/, '');
    }
    const clean = String(subdomain || '').trim().replace(/\.workable\.com$/i, '');
    if (!clean) {
        throw new Error('Workable subdomain is required');
    }
    return `https://${clean}.workable.com/spi/v3`;
}

export function unifyWorkableJob(raw: Record<string, any>): UnifiedAtsJob {
    const stateMap: Record<string, UnifiedAtsJob['status']> = {
        published: 'OPEN',
        closed: 'CLOSED',
        draft: 'DRAFT',
        archived: 'ARCHIVED',
    };
    const rawState = String(raw.state || 'draft').toLowerCase();
    return {
        id: String(raw.shortcode || raw.id || ''),
        title: String(raw.title || raw.full_title || ''),
        description: String(raw.description || ''),
        status: stateMap[rawState] || 'DRAFT',
        department: raw.department || undefined,
        location: raw.location?.location_str || raw.location?.city || undefined,
        createdAt: raw.created_at || undefined,
        updatedAt: raw.updated_at || undefined,
        remoteData: raw,
    };
}

export function unifyWorkableCandidate(raw: Record<string, any>): UnifiedAtsCandidate {
    return {
        id: String(raw.id || ''),
        firstName: String(raw.firstname || ''),
        lastName: String(raw.lastname || ''),
        email: String(raw.email || ''),
        phone: raw.phone || undefined,
        stage: raw.stage || undefined,
        jobId: raw.job?.shortcode || undefined,
        createdAt: raw.created_at || undefined,
        updatedAt: raw.updated_at || undefined,
        remoteData: raw,
    };
}

export function disunifyWorkableCandidate(input: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    headline?: string;
    sourced?: boolean;
}): Record<string, any> {
    return {
        sourced: Boolean(input.sourced ?? true),
        candidate: {
            firstname: input.firstName,
            lastname: input.lastName,
            name: `${input.firstName} ${input.lastName}`.trim(),
            email: input.email,
            phone: input.phone || undefined,
            headline: input.headline || undefined,
        },
    };
}

export function unifyWorkableDepartment(raw: Record<string, any>): UnifiedAtsDepartment {
    const name = String(raw.department || raw.name || '');
    return {
        id: String(raw.id || name.toLowerCase().replace(/\s+/g, '-')),
        name,
        remoteData: raw,
    };
}

export function unifyWorkableOffer(raw: Record<string, any>): UnifiedAtsOffer {
    return {
        id: String(raw.id || raw.offer_id || ''),
        candidateId: String(raw.candidate_id || raw.candidate?.id || ''),
        jobId: raw.job?.shortcode || raw.job_shortcode || undefined,
        status: String(raw.state || raw.status || 'pending').toUpperCase(),
        createdAt: raw.created_at || undefined,
        remoteData: raw,
    };
}
