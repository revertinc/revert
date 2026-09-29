import axios, { AxiosRequestConfig, Method } from 'axios';
import { connections } from '@prisma/client';
import { AppConfig } from '../../constants/common';

const WORKABLE_API_SUFFIX = '/spi/v3';

type WorkableConnection = Partial<connections> & {
    app?: { app_config?: unknown };
};

export function normalizeWorkableSubdomain(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    let candidate = value.trim().toLowerCase();
    if (!candidate) return undefined;

    candidate = candidate.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    candidate = candidate.split('/')[0];
    if (candidate.endsWith('.workable.com')) {
        candidate = candidate.slice(0, -'.workable.com'.length);
    }

    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(candidate)) {
        return undefined;
    }
    return candidate;
}

export function getWorkableSubdomain(connection: WorkableConnection): string {
    const appConfig = connection.app?.app_config as AppConfig | undefined;
    const candidates = [connection.tp_account_url, appConfig?.org_url, appConfig?.subdomain, connection.tp_customer_id];

    for (const value of candidates) {
        const subdomain = normalizeWorkableSubdomain(value);
        if (subdomain) return subdomain;
    }

    throw new Error('Workable subdomain is missing or invalid');
}

export function getWorkableBaseUrl(connection: WorkableConnection): string {
    return `https://${getWorkableSubdomain(connection)}.workable.com${WORKABLE_API_SUFFIX}`;
}

export function getWorkableHeaders(token: string | null | undefined) {
    if (!token || !token.trim()) throw new Error('Workable API token is missing');
    return {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };
}

export function getWorkableProxyPath(path: unknown): string {
    if (typeof path !== 'string') throw new Error('Workable proxy path is required');
    const normalized = path.trim().replace(/^\/+/, '');
    let decodedPath: string;

    try {
        decodedPath = decodeURIComponent(normalized);
    } catch {
        throw new Error('Invalid Workable proxy path');
    }

    const pathOnly = decodedPath.split(/[?#]/, 1)[0].replace(/\\/g, '/');
    if (
        !normalized ||
        normalized.includes('://') ||
        normalized.startsWith('//') ||
        normalized.includes('\\') ||
        pathOnly.split('/').some((segment) => segment === '..' || segment === '.')
    ) {
        throw new Error('Invalid Workable proxy path');
    }
    return normalized;
}

export function getWorkableNextCursor(payload: any): string | undefined {
    const next = payload?.paging?.next;
    if (typeof next !== 'string' || !next.trim()) return undefined;

    try {
        const parsed = new URL(next);
        return parsed.searchParams.get('since_id') || parsed.searchParams.get('max_id') || undefined;
    } catch {
        return undefined;
    }
}

export function getWorkableListParams(pageSize: number, cursor: unknown, fields?: Record<string, any>) {
    const params: Record<string, any> = {};
    if (Number.isFinite(pageSize) && pageSize > 0) params.limit = Math.min(pageSize, 100);
    if (typeof cursor === 'string' && cursor.trim()) params.since_id = cursor.trim();

    if (fields) {
        for (const [key, value] of Object.entries(fields)) {
            if (key === 'candidateId' || key === 'shortcode') continue;
            if (value !== undefined && value !== null) params[key] = value;
        }
    }
    return params;
}

export function getWorkableCandidatePayload(candidate: Record<string, any>, mode: 'create' | 'update' = 'update') {
    const updateFields = [
        'firstname',
        'lastname',
        'email',
        'headline',
        'summary',
        'address',
        'phone',
        'texting_consent',
        'cover_letter',
        'resume',
        'resume_url',
        'image_url',
        'image',
        'image_source',
        'education_entries',
        'experience_entries',
        'skills',
        'tags',
        'social_profiles',
    ];
    const createOnlyFields = [
        'name',
        'answers',
        'disqualified',
        'disqualification_reason',
        'disqualified_at',
        'domain',
        'recruiter_key',
    ];
    const allowed = new Set(mode === 'create' ? [...updateFields, ...createOnlyFields] : updateFields);
    const body = Object.fromEntries(
        Object.entries(candidate).filter(([key, value]) => allowed.has(key) && value !== undefined),
    );
    return { candidate: body };
}

export async function validateWorkableCredentials(subdomain: string, token: string) {
    await axios({
        method: 'get',
        url: `https://${subdomain}.workable.com${WORKABLE_API_SUFFIX}/jobs`,
        headers: getWorkableHeaders(token),
        params: { limit: 1 },
        timeout: 10000,
    });
}

export async function requestWorkable({
    connection,
    method,
    path,
    data,
    params,
    config = {},
}: {
    connection: WorkableConnection;
    method: Method | string;
    path: string;
    data?: any;
    params?: any;
    config?: AxiosRequestConfig;
}) {
    const url = `${getWorkableBaseUrl(connection)}/${getWorkableProxyPath(path)}`;
    return axios({
        method: method as Method,
        url,
        headers: getWorkableHeaders(connection.tp_access_token),
        data,
        params,
        ...config,
    });
}

export const workableUnsupported = {
    status: 'ok',
    message: 'This endpoint is currently not supported by the Workable SPI v3 integration',
};
