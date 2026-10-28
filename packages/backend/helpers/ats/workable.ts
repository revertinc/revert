import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { connections } from '@prisma/client';
import { AppConfig } from '../../constants/common';

export const WORKABLE_API_PATH = '/spi/v3';

export type WorkableConnectionLike =
    | (Partial<connections> & {
          app?: { app_config?: unknown };
          tp_account_url?: string | null;
          tp_customer_id?: string | null;
      })
    | null
    | undefined;

/**
 * Workable subdomain / account-url helpers.
 *
 * The Workable API is subdomain-scoped: requests are routed to
 * `https://{account-subdomain}.workable.com/spi/v3/...` with a Bearer token.
 *
 * The subdomain can come from (in order of precedence):
 *  1. `connection.tp_account_url` — captured at connection time
 *  2. `connection.tp_customer_id` — subdomain or account identifier persisted by the Workable auth handler
 *  3. `connection.app.app_config.org_url` or `connection.app.app_config.subdomain` — account-level configuration
 */
export const extractWorkableSubdomain = (connection: WorkableConnectionLike): string | undefined => {
    const appConfig = connection?.app?.app_config as (AppConfig & { subdomain?: string }) | undefined;
    const candidates = [
        connection?.tp_account_url,
        connection?.tp_customer_id,
        appConfig?.org_url,
        appConfig?.subdomain,
    ];

    for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'string') {
            continue;
        }
        const trimmed = candidate.trim();
        if (!trimmed) {
            continue;
        }
        // Tolerated formats: "acme", "acme.workable.com", "https://acme.workable.com",
        // "https://acme.workable.com/spi/v3/"
        const match = trimmed.match(
            /^(?:https?:\/\/)?([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)(?:\.workable\.com)?(?:\/.*)?$/i,
        );
        if (match?.[1]) {
            return match[1].toLowerCase();
        }
    }
    return undefined;
};

/**
 * Builds the Workable SPI v3 base URL for a connection or throws a descriptive error
 * when the subdomain could not be resolved.
 */
export const getWorkableBaseUrl = (connection: WorkableConnectionLike): string => {
    const subdomain = extractWorkableSubdomain(connection);
    if (!subdomain) {
        throw new Error(
            'Workable account URL or subdomain is required — set it via app_config.org_url before connecting.',
        );
    }
    return `https://${subdomain}.workable.com${WORKABLE_API_PATH}`;
};

/**
 * Standard Bearer auth headers for the Workable API.
 */
export const getWorkableAuthHeaders = (token?: string | null) => ({
    Authorization: `Bearer ${token || ''}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
});

/**
 * Safely extracts a collection array from a Workable list response
 * (e.g. `{ candidates: [...], paging: {...} }`).
 */
export const extractWorkableCollection = <T = Record<string, unknown>>(data: unknown, key: string): T[] => {
    if (Array.isArray(data)) {
        return data as T[];
    }
    if (data && typeof data === 'object') {
        const record = data as Record<string, unknown>;
        if (Array.isArray(record[key])) {
            return record[key] as T[];
        }
        if (Array.isArray(record.data)) {
            return record.data as T[];
        }
    }
    return [];
};

/**
 * Safely extracts a single resource from a Workable item response
 * (e.g. `{ candidate: {...} }`).
 */
export const extractWorkableResource = <T = Record<string, unknown>>(data: unknown, key?: string): T => {
    if (key && data && typeof data === 'object') {
        const record = data as Record<string, unknown>;
        if (key in record) {
            return record[key] as T;
        }
    }
    if (data && typeof data === 'object') {
        const record = data as Record<string, unknown>;
        if ('data' in record && record.data) {
            return record.data as T;
        }
    }
    return data as T;
};

/**
 * Resolves the next pagination cursor from a Workable `paging.next` response.
 * Workable returns a full URL (`...?limit=50&since_id=xyz`) — we hand back the
 * `since_id` or cursor value so callers can pass it as the Revert list `cursor`.
 */
export const nextWorkableCursor = (data: unknown): string | undefined => {
    if (!data || typeof data !== 'object') {
        return undefined;
    }
    const record = data as Record<string, unknown>;
    const paging = record.paging as Record<string, unknown> | undefined;
    if (paging?.next_id !== undefined && paging?.next_id !== null) {
        return String(paging.next_id);
    }
    const nextUrl = (paging?.next as string | undefined) || (record.next as string | undefined);
    if (typeof nextUrl === 'string' && nextUrl.trim()) {
        try {
            const urlObj = new URL(nextUrl);
            const sinceId =
                urlObj.searchParams.get('since_id') ||
                urlObj.searchParams.get('after_id') ||
                urlObj.searchParams.get('cursor');
            if (sinceId) {
                return sinceId;
            }
        } catch {
            // not a full URL — treat it as a bare cursor
        }
        return nextUrl;
    }
    return undefined;
};

/**
 * Helper for returning consistent unsupported responses for optional ATS endpoints.
 */
export const workableNotSupportedBody = (type: 'message' | 'result' = 'message') => ({
    status: 'ok',
    [type]: 'This endpoint is currently not supported',
});

/**
 * Makes an authenticated request to the Workable SPI v3 API for a connection.
 */
export const requestWorkable = async <T = unknown>({
    connection,
    method,
    path,
    data,
    params,
    config = {},
}: {
    connection: connections & { app?: { app_config?: unknown } };
    method: Method | string;
    path: string;
    data?: unknown;
    params?: unknown;
    config?: AxiosRequestConfig;
}): Promise<AxiosResponse<T>> => {
    const baseUrl = getWorkableBaseUrl(connection);
    const normalizedPath = path.replace(/^\/+/, '').replace(/^spi\/v3\/?/, '');
    const url = `${baseUrl}/${normalizedPath}`;

    return axios({
        method: method as Method,
        url,
        headers: getWorkableAuthHeaders(connection.tp_access_token),
        data,
        params,
        ...config,
    });
};
