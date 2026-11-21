import axios from 'axios';
import { AppConfig } from '../../constants/common';

export type WorkableConnection = {
    tp_access_token: string;
    tp_account_url?: string | null;
    app_config?: unknown;
    app?: {
        app_config?: unknown;
    } | null;
};

const WORKABLE_API_PATH = '/spi/v3';

export const getWorkableConfig = (connection: WorkableConnection): AppConfig => {
    return ((connection?.app_config || connection?.app?.app_config || {}) as AppConfig) || {};
};

export const getWorkableSubdomain = (connection: WorkableConnection): string => {
    const connectionConfig = (connection?.app_config || {}) as AppConfig;
    const appConfig = (connection?.app?.app_config || {}) as AppConfig;
    const configuredValue =
        connectionConfig.subdomain ||
        appConfig.subdomain ||
        connectionConfig.org_url ||
        appConfig.org_url ||
        connection.tp_account_url;

    if (!configuredValue) {
        throw new Error('Workable account subdomain is required in app_config.subdomain or app_config.org_url');
    }

    return String(configuredValue)
        .trim()
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .replace(/\.workable\.com$/i, '');
};

export const getWorkableBaseUrl = (connection: WorkableConnection): string => {
    return `https://${getWorkableSubdomain(connection)}.workable.com${WORKABLE_API_PATH}`;
};

export const getWorkableHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
});

export const buildWorkableParams = ({
    pageSize,
    cursor,
    fields,
}: {
    pageSize?: number;
    cursor?: unknown;
    fields?: Record<string, any>;
}) => {
    const params: Record<string, any> = { ...(fields || {}) };

    if (pageSize && !Number.isNaN(pageSize)) {
        params.limit = pageSize;
    }

    if (cursor) {
        params.max_id = cursor;
    }

    return params;
};

export const getWorkableCollection = (data: any, collectionKey: string): any[] => {
    if (Array.isArray(data?.[collectionKey])) {
        return data[collectionKey];
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    if (Array.isArray(data)) {
        return data;
    }

    return [];
};

export const getWorkableResource = (data: any, key: string) => data?.[key] || data;

export const getWorkableNextCursor = (data: any): string | undefined => {
    const next = data?.paging?.next;

    if (next) {
        try {
            const url = new URL(next);
            return url.searchParams.get('max_id') || url.searchParams.get('since_id') || undefined;
        } catch (_error) {
            return next;
        }
    }

    if (data?.paging?.next_id) {
        return data.paging.next_id;
    }

    if (data?.next) {
        return data.next;
    }

    return undefined;
};

export const requestWorkable = async ({
    connection,
    method,
    path,
    data,
    params,
}: {
    connection: WorkableConnection;
    method: string;
    path: string;
    data?: any;
    params?: any;
}) => {
    const baseUrl = getWorkableBaseUrl(connection);
    const normalizedPath = path.replace(/^\/+/, '');

    return axios({
        method,
        url: `${baseUrl}/${normalizedPath}`,
        headers: getWorkableHeaders(connection.tp_access_token),
        data,
        params,
    });
};
