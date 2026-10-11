import axios, { AxiosRequestConfig, Method } from 'axios';
import { connections } from '@prisma/client';
import { AppConfig } from '../../constants/common';

export const WORKABLE_API_PATH = '/spi/v3';

/**
 * Workable subdomain / account-url helpers.
 *
 * The Workable API is subdomain-scoped: every request goes to
 * `https://{account-subdomain}.workable.com/spi/v3/...` with a Bearer token.
 *
 * The subdomain can come from (in order of precedence):
 *  1. `connection.tp_account_url`   — captured at connection time (greenhouse-style basic auth flow)
 *  2. `connection.tp_customer_id`   — subdomain persisted by the Workable auth handler
 *  3. `connection.app.app_config.org_url` — account-level configuration (EditCredentials UI)
 */
export const extractWorkableSubdomain = (
    connection: (Partial<connections> & { app?: { app_config?: unknown } }) | null | undefined,
): string | undefined => {
    const candidates = [
        (connection as any)?.tp_account_url,
        (connection as any)?.tp_customer_id,
        (connection?.app?.app_config as AppConfig | undefined)?.org_url,
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
export const getWorkableBaseUrl = (
    connection: (Partial<connections> & { app?: { app_config?: unknown } }) | null | undefined,
): string => {
    const subdomain = extractWorkableSubdomain(connection);
    if (!subdomain) {
        throw new Error('Workable account subdomain is required — set it via app_config.org_url before connecting.');
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
export const extractWorkableCollection = <T = any>(data: any, key: string): T[] => {
    if (Array.isArray(data)) {
        return data;
    }
    if (data && typeof data === 'object') {
        if (Array.isArray(data[key])) {
            return data[key];
        }
        if (Array.isArray(data.data)) {
            return data.data;
        }
    }
    return [];
};

/**
 * Safely extracts a single resource from a Workable item response
 * (e.g. `{ candidate: {...} }`).
 */
export const extractWorkableResource = <T = any>(data: any, key?: string): T => {
    if (key && data && typeof data === 'object' && key in data) {
        return data[key];
    }
    if (data && typeof data === 'object' && 'data' in data && data.data) {
        return data.data;
    }
    return data;
};

/**
 * Resolves the next pagination cursor from a Workable `paging.next` response.
 * Workable returns a full URL (`...?limit=50&since_id=xyz`) — we hand back the
 * `since_id` value so callers can pass it as the Revert list `cursor`.
 */
export const nextWorkableCursor = (data: any): string | undefined => {
    if (!data || typeof data !== 'object') {
        return undefined;
    }
    if (data.paging?.next_id !== undefined && data.paging?.next_id !== null) {
        return String(data.paging.next_id);
    }
    const nextUrl = data.paging?.next || data.next;
    if (typeof nextUrl === 'string' && nextUrl.trim()) {
        try {
            const urlObj = new URL(nextUrl);
            const sinceId = urlObj.searchParams.get('since_id');
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
 * Makes an authenticated request to the Workable SPI v3 API for a connection.
 */
export const requestWorkable = async ({
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
    data?: any;
    params?: any;
    config?: AxiosRequestConfig;
}) => {
    const baseUrl = getWorkableBaseUrl(connection);
    const normalizedPath = path.replace(/^\/+/, '');
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
