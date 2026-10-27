/**
 * Workday integration helpers.
 *
 * Workday is tenant-hosted: every customer runs on their own host
 * (e.g. https://wd2-impl-services1.workday.com) under a tenant name, and all
 * REST + OAuth endpoints live beneath that host:
 *
 *   REST base:  https://{host}/ccx/api/v1/{tenant}
 *   Authorize:  https://{host}/ccx/oauth2/{tenant}/authorize
 *   Token:      https://{host}/ccx/oauth2/{tenant}/token
 *
 * The tenant URL is supplied by the user when connecting the app (stored in
 * app_config), because there is no single Workday API domain. Everything in
 * this module is pure so it can be unit-tested without network access.
 */

export type WorkdayAppConfig = {
    env?: 'production' | 'sandbox';
    /** Full tenant URL, e.g. https://wd2-impl-services1.workday.com/ccx/api/v1/acme */
    tenantUrl?: string;
    /** Alias kept for the client credentials form */
    organisationUrl?: string;
};

export type WorkdayTenant = {
    /** e.g. wd2-impl-services1.workday.com */
    host: string;
    /** e.g. acme */
    tenant: string;
    /** e.g. https://wd2-impl-services1.workday.com/ccx/api/v1/acme */
    baseUrl: string;
};

const WORKDAY_HOST_SUFFIX = '.workday.com';
const CCX_API_PREFIX = '/ccx/api/v1/';

export class WorkdayConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WorkdayConfigError';
    }
}

/**
 * Parse and validate a user-supplied Workday tenant URL.
 * Accepts either the full REST URL or just the host (tenant then comes from
 * app_config). Throws WorkdayConfigError for anything that is not a Workday
 * host, so a bad config fails loudly instead of leaking tokens elsewhere.
 */
export function parseWorkdayTenantUrl(tenantUrl: string | undefined | null, fallbackTenant?: string): WorkdayTenant {
    if (!tenantUrl || typeof tenantUrl !== 'string' || !tenantUrl.trim()) {
        throw new WorkdayConfigError('Workday tenant URL is required');
    }
    let parsed: URL;
    try {
        parsed = new URL(tenantUrl.trim());
    } catch {
        throw new WorkdayConfigError(`Invalid Workday tenant URL: ${tenantUrl}`);
    }
    if (parsed.protocol !== 'https:') {
        throw new WorkdayConfigError('Workday tenant URL must use https');
    }
    const host = parsed.hostname.toLowerCase();
    if (!host.endsWith(WORKDAY_HOST_SUFFIX)) {
        throw new WorkdayConfigError(`Workday tenant URL must point at a *.workday.com host, got: ${host}`);
    }

    let tenant = fallbackTenant;
    const ccxIndex = parsed.pathname.indexOf(CCX_API_PREFIX);
    if (ccxIndex !== -1) {
        const fromPath = parsed.pathname.slice(ccxIndex + CCX_API_PREFIX.length).split('/')[0];
        if (fromPath) tenant = fromPath;
    }
    if (!tenant) {
        throw new WorkdayConfigError('Workday tenant name is required (last path segment of the tenant URL)');
    }
    if (!/^[A-Za-z0-9_-]+$/.test(tenant)) {
        throw new WorkdayConfigError(`Invalid Workday tenant name: ${tenant}`);
    }
    return { host, tenant, baseUrl: `https://${host}${CCX_API_PREFIX}${tenant}` };
}

/** OAuth endpoints for a parsed tenant. */
export function getWorkdayOAuthUrls(tenant: WorkdayTenant) {
    return {
        authorizeUrl: `https://${tenant.host}/ccx/oauth2/${tenant.tenant}/authorize`,
        tokenUrl: `https://${tenant.host}/ccx/oauth2/${tenant.tenant}/token`,
    };
}

/** REST base for a parsed tenant, e.g. .../ccx/api/v1/acme/recruiting/v1 */
export function getWorkdayServiceUrl(tenant: WorkdayTenant, service: 'recruiting' | 'staffing') {
    return `${tenant.baseUrl}/${service}/v1`;
}

/**
 * Workday list endpoints paginate with limit/offset and return a `total`
 * count alongside `data`.
 */
export const WORKDAY_PAGE_SIZE = 100;

export function buildWorkdayListParams(page: number = 1) {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    return { limit: WORKDAY_PAGE_SIZE, offset: (safePage - 1) * WORKDAY_PAGE_SIZE };
}

export function hasNextWorkdayPage(data: any[] | undefined, total: number | undefined, page: number = 1) {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const seen = safePage * WORKDAY_PAGE_SIZE;
    if (typeof total === 'number') return seen < total;
    return Array.isArray(data) && data.length === WORKDAY_PAGE_SIZE;
}

/**
 * Workday nests entity payloads (candidateData, jobRequisitionData, ...).
 * Lift the nested bag onto the top level so field mappings can address
 * `firstName` instead of `candidateData.nameData.legalNameData.firstName`.
 */
export function unwrapWorkdayEntity<T extends Record<string, any>>(obj: T, dataKey: string): T {
    if (!obj || typeof obj !== 'object') return obj;
    const nested = (obj as Record<string, any>)[dataKey];
    if (!nested || typeof nested !== 'object') return obj;
    const { [dataKey]: _dropped, ...rest } = obj as Record<string, any>;
    return { ...rest, ...nested } as T;
}

/** Pull the list out of a Workday list response ({ data, total }). */
export function extractWorkdayList(response: any): { data: any[]; total?: number } {
    const data = Array.isArray(response?.data) ? response.data : [];
    const total = typeof response?.total === 'number' ? response.total : undefined;
    return { data, total };
}
