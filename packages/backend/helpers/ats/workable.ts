import axios, { AxiosRequestConfig, Method } from 'axios';
import { connections } from '@prisma/client';
import { AppConfig } from '../../constants/common';

export const WORKABLE_API_PATH = '/spi/v3';

/**
 * Extracts and normalizes the base URL for Workable SPI v3.
 * Supports:
 * - Subdomain only: "acme" -> "https://acme.workable.com/spi/v3"
 * - Full host: "acme.workable.com" -> "https://acme.workable.com/spi/v3"
 * - Full URL: "https://acme.workable.com" -> "https://acme.workable.com/spi/v3"
 * - URL with path: "https://acme.workable.com/spi/v3/" -> "https://acme.workable.com/spi/v3"
 */
export const getWorkableBaseUrl = (
    connection: (Partial<connections> & { app?: { app_config?: unknown } }) | null | undefined,
): string => {
    const configuredUrl =
        (connection as any)?.tp_account_url ||
        (connection?.app?.app_config as AppConfig | undefined)?.org_url ||
        (connection as any)?.subdomain;

    if (!configuredUrl || typeof configuredUrl !== 'string' || !configuredUrl.trim()) {
        throw new Error(
            'Workable account URL or subdomain is required in app_config.org_url or connection.tp_account_url',
        );
    }

    const cleaned = configuredUrl
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/\/spi\/v3\/?$/i, '')
        .replace(/\/+$/, '');

    const host = cleaned.toLowerCase().includes('.workable.com') ? cleaned : `${cleaned}.workable.com`;

    return `https://${host}${WORKABLE_API_PATH}`;
};

/**
 * Returns standard authentication headers for Workable API requests.
 */
export const getWorkableAuthHeaders = (token?: string | null) => ({
    Authorization: `Bearer ${token || ''}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
});

/**
 * Safely extracts an array collection from a Workable response object.
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
 * Safely extracts a single entity resource from a Workable response.
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
 * Resolves the next pagination cursor from a Workable paging response.
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
            const afterId = urlObj.searchParams.get('after_id');
            if (afterId) {
                return afterId;
            }
            const cursor = urlObj.searchParams.get('cursor');
            if (cursor) {
                return cursor;
            }
        } catch {
            // If nextUrl is not a full URL, treat it as a direct cursor
        }
        return nextUrl;
    }

    return undefined;
};

/**
 * Makes an authenticated request to the Workable SPI v3 API.
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

/**
 * Generates the standard payload for unsupported endpoints in Revert ATS.
 */
export const workableNotSupportedBody = (field: 'message' | 'result' = 'message') => ({
    status: 'ok',
    [field]: 'This endpoint is currently not supported',
});
