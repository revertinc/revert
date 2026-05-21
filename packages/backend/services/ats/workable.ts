const WORKABLE_HOST_SUFFIX = '.workable.com';

export const normalizeWorkableAccountUrl = (accountUrlOrSubdomain?: string | string[]) => {
    const rawValue = Array.isArray(accountUrlOrSubdomain) ? accountUrlOrSubdomain[0] : accountUrlOrSubdomain;

    if (!rawValue?.trim()) {
        throw new Error('Workable accountURL or subdomain is required');
    }

    let urlValue = rawValue.trim();
    if (!/^https?:\/\//i.test(urlValue)) {
        urlValue = urlValue.replace(/\.workable\.com\/?$/i, '');
        urlValue = `https://${urlValue}.workable.com`;
    }

    const parsedUrl = new URL(urlValue);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (parsedUrl.protocol !== 'https:' || !hostname.endsWith(WORKABLE_HOST_SUFFIX)) {
        throw new Error('Workable accountURL must be an HTTPS workable.com subdomain');
    }

    return `https://${hostname}`;
};

export const getWorkableAccountSubdomain = (accountUrl: string) =>
    new URL(accountUrl).hostname.replace(WORKABLE_HOST_SUFFIX, '');

export const getWorkableHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
});

export const getWorkableApiUrl = (connection: { tp_account_url?: string | null }, path: string) => {
    const sanitizedPath = path.replace(/^\/+/, '').replace(/^spi\/v3\/?/i, '');
    return `${normalizeWorkableAccountUrl(connection.tp_account_url || undefined)}/spi/v3/${sanitizedPath}`;
};

export const getWorkableListData = (data: any, key: string) => {
    if (Array.isArray(data)) {
        return data;
    }

    return Array.isArray(data?.[key]) ? data[key] : [];
};

export const getWorkableNextCursor = (data: any) => {
    const nextUrl = data?.paging?.next;
    if (!nextUrl) {
        return undefined;
    }

    try {
        const next = new URL(nextUrl);
        return next.searchParams.get('since_id') || next.searchParams.get('max_id') || nextUrl;
    } catch {
        return nextUrl;
    }
};

export const getWorkablePaginationParams = ({
    fields,
    pageSize,
    cursor,
}: {
    fields?: Record<string, any>;
    pageSize?: number;
    cursor?: unknown;
}) => {
    const params: Record<string, any> = { ...(fields || {}) };

    if (pageSize) {
        params.limit = pageSize;
    }

    if (cursor) {
        const cursorValue = String(cursor);
        try {
            const cursorUrl = new URL(cursorValue);
            params.since_id = cursorUrl.searchParams.get('since_id') || cursorUrl.searchParams.get('max_id');
        } catch {
            params.since_id = cursorValue;
        }
    }

    return params;
};
