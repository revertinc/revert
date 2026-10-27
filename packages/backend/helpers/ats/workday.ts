import { AppConfig } from '../../constants/common';

export type WorkdayResource = 'candidates' | 'jobPostings' | 'jobOffers' | 'organizations';

export type WorkdayConnection = {
    tp_access_token?: string | null;
    tp_account_url?: string | null;
    app_config?: unknown;
    app?: { app_config?: unknown } | null;
};

export type WorkdayConfig = {
    apiBaseUrl?: string;
    tokenUrl?: string;
    authUrl?: string;
    tenant?: string;
};

export type WorkdayEndpoints = {
    origin: string;
    tenant?: string;
    recruitingBase: string;
    staffingBase: string;
    tokenUrl: string;
    authorizeUrl: string;
};

const trimSlash = (value: string) => value.replace(/\/+$/, '');

export function parseWorkdayTenantUrl(
    raw: string,
    cfg: Pick<WorkdayConfig, 'tokenUrl' | 'authUrl'> = {},
): WorkdayEndpoints {
    const value = trimSlash((raw || '').trim());
    if (!value) {
        return {
            origin: '',
            recruitingBase: '',
            staffingBase: '',
            tokenUrl: trimSlash(cfg.tokenUrl || ''),
            authorizeUrl: trimSlash(cfg.authUrl || ''),
        };
    }

    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
        throw new Error('Workday organisation URL must use HTTPS');
    }

    const path = parsed.pathname.replace(/\/+$/, '');
    const origin = parsed.origin;
    let tenant: string | undefined;
    let version = 'v1';

    const rest = path.match(/^\/ccx\/api\/(recruiting|staffing)\/(v\d+)\/([^/]+)(?:\/.*)?$/);
    const genericRest = path.match(/^\/ccx\/api\/(v\d+)\/([^/]+)(?:\/.*)?$/);
    const oauth = path.match(/^\/ccx\/oauth2\/([^/]+)(?:\/.*)?$/);

    if (rest) {
        version = rest[2];
        tenant = rest[3];
    } else if (genericRest) {
        version = genericRest[1];
        tenant = genericRest[2];
    } else if (oauth) {
        tenant = oauth[1];
    } else {
        const parts = path.split('/').filter(Boolean);
        if (parts.length) tenant = parts[0] === 'wday' ? parts[1] : parts[0];
    }

    const recruitingBase = tenant ? origin + '/ccx/api/recruiting/' + version + '/' + tenant : origin;
    const staffingBase = tenant ? origin + '/ccx/api/staffing/' + version + '/' + tenant : origin;
    const tokenUrl = trimSlash(cfg.tokenUrl || '') || (tenant ? origin + '/ccx/oauth2/' + tenant + '/token' : '');
    const authorizeUrl =
        trimSlash(cfg.authUrl || '') || (tenant ? origin + '/ccx/oauth2/' + tenant + '/authorize' : '');

    return { origin, tenant, recruitingBase, staffingBase, tokenUrl, authorizeUrl };
}

function configuredOrgUrl(connection: WorkdayConnection, cfg: WorkdayConfig): string {
    const own = (connection.app_config as AppConfig | undefined)?.org_url?.trim();
    const app = (connection.app?.app_config as AppConfig | undefined)?.org_url?.trim();
    const saved = connection.tp_account_url?.trim();
    return trimSlash(own || app || saved || cfg.apiBaseUrl || '');
}

export function resolveWorkdayEndpoints(connection: WorkdayConnection, cfg: WorkdayConfig = {}): WorkdayEndpoints {
    let orgUrl = configuredOrgUrl(connection, cfg);
    if (orgUrl && cfg.tenant) {
        const parsed = new URL(orgUrl);
        if (!parsed.pathname || parsed.pathname === '/') orgUrl = trimSlash(parsed.origin) + '/' + cfg.tenant;
    }
    return parseWorkdayTenantUrl(orgUrl, cfg);
}

export function workdayHeaders(token?: string | null): Record<string, string> {
    if (!token) throw new Error('Workday access token is missing');
    return { Authorization: 'Bearer ' + token, Accept: 'application/json', 'Content-Type': 'application/json' };
}

export function workdayResourceUrl(
    connection: WorkdayConnection,
    resource: WorkdayResource,
    id: string | undefined,
    query: URLSearchParams | undefined,
    cfg: WorkdayConfig = {},
): string {
    const endpoints = resolveWorkdayEndpoints(connection, cfg);
    if (!endpoints.tenant) throw new Error('Workday tenant URL is not configured');
    const base = resource === 'organizations' ? endpoints.staffingBase : endpoints.recruitingBase;
    const url = new URL(trimSlash(base) + '/' + resource + (id ? '/' + encodeURIComponent(id) : ''));
    query?.forEach((value, key) => url.searchParams.append(key, value));
    return url.toString();
}

export function workdayListParams(pageSize?: number, cursor?: string, fields?: Record<string, unknown>) {
    const params = new URLSearchParams();
    if (Number.isFinite(pageSize) && Number(pageSize) > 0) params.set('limit', String(pageSize));
    if (cursor !== undefined && cursor !== '') {
        const offset = Number(cursor);
        if (!Number.isFinite(offset) || offset < 0) throw new Error('Invalid Workday cursor');
        params.set('offset', String(offset));
    }
    if (fields) {
        Object.entries(fields).forEach(([key, value]) => {
            if (value !== undefined && value !== null) params.set(key, String(value));
        });
    }
    return params;
}

export function workdayResource(payload: any): any {
    if (payload?.data && !Array.isArray(payload.data) && typeof payload.data === 'object') {
        return payload.data;
    }
    return payload;
}

export function workdayCollection(payload: any): { items: any[]; total?: number } {
    if (Array.isArray(payload)) return { items: payload, total: payload.length };
    if (Array.isArray(payload?.data)) return { items: payload.data, total: payload.total };
    if (Array.isArray(payload?.results)) return { items: payload.results, total: payload.total };
    return { items: [] };
}

export function workdayNextCursor(offset: number, count: number, total?: number, limit?: number): string | undefined {
    if (count <= 0) return undefined;
    const next = offset + count;
    if (typeof total === 'number') return next < total ? String(next) : undefined;
    return limit && count === limit ? String(next) : undefined;
}

/**
 * Proxy requests are intentionally restricted to the configured Workday tenant origin.
 * This prevents a caller from smuggling a Workday bearer token to an arbitrary host.
 */
export function workdayProxyUrl(connection: WorkdayConnection, path: string, cfg: WorkdayConfig = {}): string {
    const endpoints = resolveWorkdayEndpoints(connection, cfg);
    if (!endpoints.tenant) throw new Error('Workday tenant URL is not configured');

    const base = endpoints.recruitingBase + '/';
    const isAbsolute = /^https?:\/\//i.test(path);
    const proxyPath = isAbsolute || path.startsWith('/ccx/') ? path : path.replace(/^\/+/, '');
    const target = new URL(proxyPath, base);

    if (target.origin !== endpoints.origin) {
        throw new Error('Workday proxy target must stay on the configured tenant origin');
    }

    const allowedBases = [endpoints.recruitingBase, endpoints.staffingBase].map((value) => new URL(value).pathname);
    const staysInConfiguredTenantApi = allowedBases.some(
        (allowed) => target.pathname === allowed || target.pathname.startsWith(allowed + '/'),
    );
    if (!staysInConfiguredTenantApi) {
        throw new Error('Workday proxy target must stay within the configured tenant API');
    }
    return target.toString();
}

export function workdayEnv(cfg: {
    WORKDAY_API_BASE_URL?: string;
    WORKDAY_TOKEN_URL?: string;
    WORKDAY_AUTH_URL?: string;
    WORKDAY_TENANT?: string;
}): WorkdayConfig {
    return {
        apiBaseUrl: cfg.WORKDAY_API_BASE_URL,
        tokenUrl: cfg.WORKDAY_TOKEN_URL,
        authUrl: cfg.WORKDAY_AUTH_URL,
        tenant: cfg.WORKDAY_TENANT,
    };
}
