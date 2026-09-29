import {
    getWorkableCandidatePayload,
    getWorkableListParams,
    getWorkableNextCursor,
    getWorkableProxyPath,
    normalizeWorkableSubdomain,
} from '../workable';

describe('Workable ATS helpers', () => {
    test('normalizes supported account forms', () => {
        expect(normalizeWorkableSubdomain('Acme')).toBe('acme');
        expect(normalizeWorkableSubdomain('https://acme.workable.com/')).toBe('acme');
        expect(normalizeWorkableSubdomain('acme.workable.com/spi/v3')).toBe('acme');
    });

    test('rejects unsafe or malformed subdomains', () => {
        expect(normalizeWorkableSubdomain('')).toBeUndefined();
        expect(normalizeWorkableSubdomain('https://evil.example.com')).toBeUndefined();
        expect(normalizeWorkableSubdomain('../acme')).toBeUndefined();
    });

    test('uses Workable paging.next as a stable cursor', () => {
        expect(
            getWorkableNextCursor({
                paging: { next: 'https://acme.workable.com/spi/v3/candidates?limit=50&since_id=abc123' },
            }),
        ).toBe('abc123');
        expect(getWorkableNextCursor({ paging: {} })).toBeUndefined();
        expect(
            getWorkableNextCursor({ paging: { next: 'https://acme.workable.com/spi/v3/candidates?limit=50' } }),
        ).toBeUndefined();
        expect(getWorkableNextCursor({ paging: { next: 'not-a-url' } })).toBeUndefined();
    });

    test('caps page size and preserves supported filters', () => {
        expect(getWorkableListParams(500, 'abc', { state: 'published', candidateId: 'ignored' })).toEqual({
            limit: 100,
            since_id: 'abc',
            state: 'published',
        });
    });

    test('blocks proxy attempts that can escape the SPI path', () => {
        expect(getWorkableProxyPath('/jobs?state=published')).toBe('jobs?state=published');
        expect(() => getWorkableProxyPath('https://attacker.example')).toThrow();
        expect(() => getWorkableProxyPath('../secrets')).toThrow();
        expect(() => getWorkableProxyPath('jobs/../secrets')).toThrow();
        expect(() => getWorkableProxyPath('jobs\\..\\secrets')).toThrow();
        expect(() => getWorkableProxyPath('jobs/%2e%2e/secrets')).toThrow();
        expect(() => getWorkableProxyPath('jobs/%2E%2E%2Fsecrets')).toThrow();
        expect(() => getWorkableProxyPath('jobs/%5c..%5csecrets')).toThrow();
        expect(() => getWorkableProxyPath('jobs/%E0%A4%A')).toThrow();
    });

    test('whitelists documented candidate update fields and strips provider-only fields', () => {
        expect(
            getWorkableCandidatePayload({
                id: 'c1',
                firstname: 'Ada',
                lastname: 'Lovelace',
                email: 'ada@example.com',
                jobs: ['ABC123'],
                unknown: 'drop-me',
            }),
        ).toEqual({
            candidate: { firstname: 'Ada', lastname: 'Lovelace', email: 'ada@example.com' },
        });
    });

    test('allows documented create-only candidate fields on create', () => {
        expect(
            getWorkableCandidatePayload(
                { firstname: 'Ada', lastname: 'Lovelace', email: 'ada@example.com', domain: 'referral' },
                'create',
            ),
        ).toEqual({
            candidate: {
                firstname: 'Ada',
                lastname: 'Lovelace',
                email: 'ada@example.com',
                domain: 'referral',
            },
        });
    });
});
