import axios from 'axios';
import { connections } from '@prisma/client';
import { AppConfig } from '../../constants/common';

const WORKABLE_API_PATH = '/spi/v3';

export const getWorkableBaseUrl = (connection: connections & { app?: { app_config?: unknown } }) => {
    const configuredUrl = connection.tp_account_url || (connection?.app?.app_config as AppConfig | undefined)?.org_url;

    if (!configuredUrl) {
        throw new Error('Workable account URL or subdomain is required in app_config.org_url');
    }

    const normalized = configuredUrl
        .trim()
        .replace(/^https?:\/\//, '')
        .replace(/\/spi\/v3\/?$/, '')
        .replace(/\/+$/, '');

    const host = normalized.includes('.workable.com') ? normalized : `${normalized}.workable.com`;
    return `https://${host}${WORKABLE_API_PATH}`;
};

export const getWorkableHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
});

export const getWorkableCollection = (data: any, key: string) => {
    if (Array.isArray(data)) return data;
    return data?.[key] || data?.data || [];
};

export const getWorkableResource = (data: any, key: string) => data?.[key] || data;

export const getWorkableNextCursor = (data: any) => {
    if (data?.paging?.next) return data.paging.next;
    if (data?.paging?.next_id) return data.paging.next_id;
    if (data?.next) return data.next;
    return undefined;
};

export const requestWorkable = async ({
    connection,
    method,
    path,
    data,
    params,
}: {
    connection: connections & { app?: { app_config?: unknown } };
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
