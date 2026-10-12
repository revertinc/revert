import axios, { AxiosRequestConfig } from 'axios';

export const normalizeWorkableSubdomain = (value: unknown): string => {
    if (typeof value !== 'string') throw new Error('A Workable account subdomain is required');
    const match = value.trim().toLowerCase().match(/^(?:https:\/\/)?([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.workable\.com)?\/?$/);
    if (!match) throw new Error('Invalid Workable account subdomain');
    return match[1];
};

/** Keep credentials on the connected account's SPI API, including on redirects. */
export const requestWorkable = async (
    subdomain: string,
    token: string,
    request: Pick<AxiosRequestConfig, 'method' | 'data' | 'params'> & { path: string },
) => {
    const base = new URL(`https://${normalizeWorkableSubdomain(subdomain)}.workable.com/spi/v3/`);
    if (typeof request.path !== 'string' || !request.path || /[\\#]/.test(request.path)) {
        throw new Error('Invalid Workable API path');
    }
    const url = new URL(request.path, base);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || url.username || url.password) {
        throw new Error('Workable API path must stay within /spi/v3/ on the connected account');
    }
    try {
        return await axios({
            url: url.toString(),
            method: request.method,
            data: request.data,
            params: request.params,
            headers: { Authorization: `Bearer ${token}` },
            maxRedirects: 0,
            timeout: 15000,
        });
    } catch {
        // Axios errors contain the Authorization header; do not pass them to logs or responses.
        throw new Error('Workable API request failed; check the account subdomain, token and required scopes');
    }
};
