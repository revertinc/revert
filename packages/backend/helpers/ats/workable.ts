import { AppConfig } from '../../constants/common';

type WorkableConfig = AppConfig & {
    subdomain?: string;
    account_subdomain?: string;
};

type WorkableConnection = {
    app_config?: unknown;
    tp_account_url?: string | null;
    app?: {
        app_config?: unknown;
    } | null;
};

export const getWorkableConfig = (connection: WorkableConnection): WorkableConfig => {
    return ((connection.app_config || connection.app?.app_config || {}) as WorkableConfig) || {};
};

export const getWorkableSubdomain = (connection: WorkableConnection): string => {
    const config = getWorkableConfig(connection);
    const configuredValue = config.subdomain || config.account_subdomain || config.org_url || connection.tp_account_url;

    if (!configuredValue) {
        throw new Error('Workable account subdomain is required in app_config.org_url or app_config.subdomain');
    }

    return String(configuredValue)
        .trim()
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .replace(/\.workable\.com$/i, '');
};

export const getWorkableBaseUrl = (connection: WorkableConnection): string => {
    return `https://${getWorkableSubdomain(connection)}.workable.com/spi/v3`;
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

export const getWorkableNextCursor = (data: any): string | undefined => {
    const next = data?.paging?.next;

    if (!next) {
        return undefined;
    }

    try {
        const url = new URL(next);
        return url.searchParams.get('max_id') || url.searchParams.get('since_id') || undefined;
    } catch (_error) {
        return undefined;
    }
};
