import { AppConfig } from '../../constants/common';

const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i;

/** Normalize and validate a Workable account subdomain. */
export function normalizeWorkableSubdomain(raw: unknown): string | undefined {
    if (typeof raw !== 'string') return undefined;
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed) return undefined;
    // Allow users to paste full host like "acme.workable.com"
    const host = trimmed.replace(/^https?:\/\//, '').split('/')[0];
    const subdomain = host.endsWith('.workable.com') ? host.slice(0, -'.workable.com'.length) : host;
    if (!subdomain || subdomain === 'workable' || subdomain === 'www' || !SUBDOMAIN_RE.test(subdomain)) {
        return undefined;
    }
    return subdomain;
}

/** Resolve Workable SPI base URL from connection metadata. */
export function workableBaseUrl(connection: {
    tp_customer_id?: string | null;
    app?: { app_config?: AppConfig | null } | null;
}): string {
    const fromConfig = normalizeWorkableSubdomain(
        (connection.app?.app_config as AppConfig | undefined)?.subdomain,
    );
    const fromCustomer =
        typeof connection.tp_customer_id === 'string' && connection.tp_customer_id.startsWith('Workable:')
            ? normalizeWorkableSubdomain(connection.tp_customer_id.slice('Workable:'.length))
            : undefined;
    const subdomain = fromConfig || fromCustomer;
    if (!subdomain) {
        throw new Error('Workable subdomain is required in app_config.subdomain');
    }
    return `https://${subdomain}.workable.com/spi/v3`;
}

export function workableHeaders(token: string) {
    if (!token || !String(token).trim()) {
        throw new Error('Workable API token is required');
    }
    return {
        Authorization: `Bearer ${String(token).trim()}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };
}

/** Strip leading slashes and reject absolute / protocol-relative paths for the proxy tunnel. */
export function workableProxyPath(path: unknown): string {
    if (typeof path !== 'string' || !path.trim()) {
        throw new Error('Proxy path is required');
    }
    const cleaned = path.trim().replace(/^\/+/, '');
    if (!cleaned || cleaned.includes('://') || cleaned.startsWith('//') || cleaned.includes('..')) {
        throw new Error('Invalid proxy path');
    }
    return cleaned;
}

/** Build Workable list query string (limit + since_id cursor + extra fields). */
export function workableListQuery(pageSize: number, cursor: unknown, fields?: Record<string, any>): string {
    const params = new URLSearchParams();
    if (pageSize && !Number.isNaN(pageSize)) {
        params.set('limit', String(Math.min(Math.max(pageSize, 1), 100)));
    }
    if (typeof cursor === 'string' && cursor.trim()) {
        // Cursor may be a since_id value or a full next URL from a prior page.
        try {
            const asUrl = new URL(cursor);
            const since = asUrl.searchParams.get('since_id');
            if (since) params.set('since_id', since);
            else params.set('since_id', cursor.trim());
        } catch {
            params.set('since_id', cursor.trim());
        }
    }
    if (fields) {
        for (const [key, value] of Object.entries(fields)) {
            if (value === undefined || value === null) continue;
            params.set(key, String(value));
        }
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
}

/** Extract next cursor from Workable paging.next URL. */
export function workableNextCursor(paging?: { next?: string } | null): string | undefined {
    if (!paging?.next) return undefined;
    try {
        const u = new URL(paging.next);
        return u.searchParams.get('since_id') || paging.next;
    } catch {
        return paging.next;
    }
}
