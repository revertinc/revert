import { AppConfig } from '../../constants/common';

export const WORKDAY_NOT_SUPPORTED_MESSAGE = 'This endpoint is currently not supported';
export const WORKDAY_NOT_SUPPORTED_RESULT = 'This endpoint is currently not supported.';

export type WorkdayAtsResource = 'candidates' | 'jobPostings' | 'jobOffers' | 'organizations';

export type WorkdayConnectionLike = {
    tp_access_token?: string | null;
    tp_account_url?: string | null;
    app_config?: AppConfig | null;
    app?: {
        app_config?: AppConfig | null;
        is_revert_app?: boolean | null;
    } | null;
};

export type WorkdayTenantUrls = {
    origin: string;
    tenant?: string;
    recruitingBase: string;
    staffingBase: string;
    tokenUrl: string;
    authorizeUrl: string;
};

export function stripTrailingSlash(url: string): string {
    return url.replace(/\/+$/, '');
}

export function joinWorkdayUrl(baseUrl: string, ...segments: string[]): string {
    const root = stripTrailingSlash(baseUrl);
    const path = segments
        .filter((segment) => segment !== undefined && segment !== null && `${segment}`.length > 0)
        .map((segment) => `${segment}`.replace(/^\/+|\/+$/g, ''))
        .filter(Boolean)
        .join('/');
    return path ? `${root}/${path}` : root;
}

export function getWorkdayAuthHeaders(accessToken: string): Record<string, string> {
    return {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };
}

export function workdayNotSupportedBody(kind: 'message' | 'result' = 'message'): {
    status: string;
    message?: string;
    result?: string;
} {
    if (kind === 'result') {
        return { status: 'ok', result: WORKDAY_NOT_SUPPORTED_RESULT };
    }
    return { status: 'ok', message: WORKDAY_NOT_SUPPORTED_MESSAGE };
}

/**
 * Parse a Workday tenant URL into REST + OAuth endpoints.
 *
 * Accepted `org_url` shapes:
 * - Recruiting REST base: https://{host}/ccx/api/recruiting/v1/{tenant}
 * - Staffing REST base: https://{host}/ccx/api/staffing/v1/{tenant}
 * - Generic REST base: https://{host}/ccx/api/v1/{tenant}
 * - OAuth token URL: https://{host}/ccx/oauth2/{tenant}/token
 * - Host + tenant: https://{host}/{tenant}
 * - Host only: https://{host}  (token/authorize require WORKDAY_TOKEN_URL / WORKDAY_AUTH_URL)
 */
export function parseWorkdayOrgUrl(
    orgUrl: string,
    overrides?: { tokenUrl?: string | null; authUrl?: string | null },
): WorkdayTenantUrls {
    const trimmed = stripTrailingSlash((orgUrl || '').trim());
    if (!trimmed) {
        return {
            origin: '',
            recruitingBase: '',
            staffingBase: '',
            tokenUrl: stripTrailingSlash(overrides?.tokenUrl || ''),
            authorizeUrl: stripTrailingSlash(overrides?.authUrl || ''),
        };
    }

    const url = new URL(trimmed);
    const origin = url.origin;
    const pathname = url.pathname.replace(/\/+$/, '');
    const recruitingStaffingMatch = pathname.match(/^\/ccx\/api\/(recruiting|staffing)\/([^/]+)\/([^/]+)(?:\/.*)?$/);
    const genericRestMatch = pathname.match(/^\/ccx\/api\/(v\d+)\/([^/]+)(?:\/.*)?$/);
    const oauthMatch = pathname.match(/^\/ccx\/oauth2\/([^/]+)(?:\/.*)?$/);

    let tenant: string | undefined;
    let version = 'v1';
    let recruitingBase: string;
    let staffingBase: string;

    if (recruitingStaffingMatch) {
        version = recruitingStaffingMatch[2];
        tenant = recruitingStaffingMatch[3];
        recruitingBase = `${origin}/ccx/api/recruiting/${version}/${tenant}`;
        staffingBase = `${origin}/ccx/api/staffing/${version}/${tenant}`;
    } else if (genericRestMatch) {
        version = genericRestMatch[1];
        tenant = genericRestMatch[2];
        recruitingBase = `${origin}/ccx/api/recruiting/${version}/${tenant}`;
        staffingBase = `${origin}/ccx/api/staffing/${version}/${tenant}`;
    } else if (oauthMatch) {
        tenant = oauthMatch[1];
        recruitingBase = `${origin}/ccx/api/recruiting/${version}/${tenant}`;
        staffingBase = `${origin}/ccx/api/staffing/${version}/${tenant}`;
    } else if (pathname && pathname !== '/') {
        const parts = pathname.split('/').filter(Boolean);
        tenant = parts[0] === 'wday' ? parts[1] : parts[0];
        recruitingBase = `${origin}/ccx/api/recruiting/${version}/${tenant}`;
        staffingBase = `${origin}/ccx/api/staffing/${version}/${tenant}`;
    } else {
        recruitingBase = trimmed;
        staffingBase = trimmed;
    }

    const tokenUrl =
        stripTrailingSlash(overrides?.tokenUrl || '') || (tenant ? `${origin}/ccx/oauth2/${tenant}/token` : '');
    const authorizeUrl =
        stripTrailingSlash(overrides?.authUrl || '') || (tenant ? `${origin}/ccx/oauth2/${tenant}/authorize` : '');

    return { origin, tenant, recruitingBase, staffingBase, tokenUrl, authorizeUrl };
}

export function resolveWorkdayOrgUrl(connection: WorkdayConnectionLike, envBaseUrl?: string): string {
    const fromConnection = connection.tp_account_url?.trim();
    const fromConnectionConfig = (connection.app_config as AppConfig | undefined)?.org_url?.trim();
    const fromAppConfig = (connection.app?.app_config as AppConfig | undefined)?.org_url?.trim();
    const fromEnv = envBaseUrl?.trim();
    return stripTrailingSlash(fromConnection || fromConnectionConfig || fromAppConfig || fromEnv || '');
}

export function resolveWorkdayTenantUrls(
    connection: WorkdayConnectionLike,
    env?: { apiBaseUrl?: string; tokenUrl?: string; authUrl?: string },
): WorkdayTenantUrls {
    return parseWorkdayOrgUrl(resolveWorkdayOrgUrl(connection, env?.apiBaseUrl), {
        tokenUrl: env?.tokenUrl,
        authUrl: env?.authUrl,
    });
}

export type WorkdayEnv = { apiBaseUrl?: string; tokenUrl?: string; authUrl?: string };

export function workdayEnvFromConfig(cfg: {
    WORKDAY_API_BASE_URL?: string;
    WORKDAY_TOKEN_URL?: string;
    WORKDAY_AUTH_URL?: string;
}): WorkdayEnv {
    return {
        apiBaseUrl: cfg.WORKDAY_API_BASE_URL,
        tokenUrl: cfg.WORKDAY_TOKEN_URL,
        authUrl: cfg.WORKDAY_AUTH_URL,
    };
}

export function hasWorkdayTenantUrl(connection: WorkdayConnectionLike, env?: WorkdayEnv): boolean {
    return Boolean(resolveWorkdayOrgUrl(connection, env?.apiBaseUrl));
}

export function missingWorkdayTenantMessage(): string {
    return 'Workday tenant URL is not configured. Set app_config.org_url or WORKDAY_API_BASE_URL.';
}

export function resolveWorkdayResourceUrl(
    connection: WorkdayConnectionLike,
    resource: WorkdayAtsResource,
    id?: string,
    query?: string,
    env?: WorkdayEnv,
): string {
    const urls = resolveWorkdayTenantUrls(connection, env);
    const base = resource === 'organizations' ? urls.staffingBase : urls.recruitingBase;
    const path = id ? joinWorkdayUrl(base, resource, id) : joinWorkdayUrl(base, resource);
    if (!query) {
        return path;
    }
    const normalizedQuery = query.replace(/^[?&]+/, '');
    return normalizedQuery ? `${path}?${normalizedQuery}` : path;
}

export function resolveWorkdayProxyUrl(connection: WorkdayConnectionLike, path: string, env?: WorkdayEnv): string {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    const urls = resolveWorkdayTenantUrls(connection, env);
    return joinWorkdayUrl(urls.recruitingBase, path);
}

export function workdayListPaging(
    pageSize?: number,
    cursor?: string,
): { pagingString: string; offset: number; limit?: number } {
    const limit = Number.isFinite(pageSize) && (pageSize as number) > 0 ? pageSize : undefined;
    const offset = cursor !== undefined && cursor !== '' && Number.isFinite(Number(cursor)) ? Number(cursor) : 0;
    const parts: string[] = [];
    if (limit) {
        parts.push(`limit=${limit}`);
    }
    if (cursor) {
        parts.push(`offset=${offset}`);
    }
    return { pagingString: parts.join('&'), offset, limit };
}

export function nextWorkdayCursor(
    offset: number,
    returned: number,
    total?: number,
    limit?: number,
): string | undefined {
    if (!returned) {
        return undefined;
    }
    const nextOffset = offset + returned;
    if (typeof total === 'number') {
        return nextOffset < total ? String(nextOffset) : undefined;
    }
    if (limit && returned < limit) {
        return undefined;
    }
    if (limit && returned === limit) {
        return String(nextOffset);
    }
    return undefined;
}

export function extractWorkdayCollection(payload: any): { items: any[]; total?: number } {
    if (!payload) {
        return { items: [] };
    }
    if (Array.isArray(payload)) {
        return { items: payload, total: payload.length };
    }
    if (Array.isArray(payload.data)) {
        return { items: payload.data, total: payload.total };
    }
    if (Array.isArray(payload.results)) {
        return { items: payload.results, total: payload.total };
    }
    return { items: [] };
}

export function extractWorkdayResource(payload: any): any {
    if (payload?.data && !Array.isArray(payload.data) && typeof payload.data === 'object') {
        return payload.data;
    }
    return payload;
}

export function appendQueryParams(pagingString: string, fields?: Record<string, any>): string {
    let otherParams = '';
    if (fields) {
        otherParams = Object.keys(fields)
            .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(fields[key])}`)
            .join('&');
    }
    return [pagingString, otherParams].filter(Boolean).join('&');
}
