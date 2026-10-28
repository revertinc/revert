import axios from 'axios';
import {
    WORKABLE_API_PATH,
    extractWorkableSubdomain,
    extractWorkableCollection,
    extractWorkableResource,
    getWorkableAuthHeaders,
    getWorkableBaseUrl,
    nextWorkableCursor,
    requestWorkable,
    workableNotSupportedBody,
    WorkableConnectionLike,
} from './workable';

jest.mock('axios');
const mockedAxios = axios as unknown as jest.MockedFunction<typeof axios>;

jest.mock('../logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
    logDebug: jest.fn(),
}));

describe('Workable ATS helper utilities', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('extractWorkableSubdomain', () => {
        it('accepts a bare subdomain from app_config.org_url', () => {
            const connection: WorkableConnectionLike = {
                app: { app_config: { org_url: 'acme-corp' } },
            };
            expect(extractWorkableSubdomain(connection)).toBe('acme-corp');
        });

        it('accepts app_config.subdomain directly', () => {
            const connection: WorkableConnectionLike = {
                app: { app_config: { subdomain: 'initech' } },
            };
            expect(extractWorkableSubdomain(connection)).toBe('initech');
        });

        it('accepts a full host without protocol', () => {
            const connection: WorkableConnectionLike = {
                app: { app_config: { org_url: 'acme.workable.com' } },
            };
            expect(extractWorkableSubdomain(connection)).toBe('acme');
        });

        it('accepts a full HTTPS URL', () => {
            const connection: WorkableConnectionLike = {
                app: { app_config: { org_url: 'https://initech.workable.com' } },
            };
            expect(extractWorkableSubdomain(connection)).toBe('initech');
        });

        it('accepts a URL that includes /spi/v3/ and trailing path', () => {
            const connection: WorkableConnectionLike = {
                app: { app_config: { org_url: 'https://groove-tech.workable.com/spi/v3/' } },
            };
            expect(extractWorkableSubdomain(connection)).toBe('groove-tech');
        });

        it('prefers tp_account_url over tp_customer_id over app_config', () => {
            const connection: WorkableConnectionLike = {
                tp_account_url: 'https://primary.workable.com',
                tp_customer_id: 'secondary',
                app: { app_config: { org_url: 'tertiary' } },
            };
            expect(extractWorkableSubdomain(connection)).toBe('primary');
        });

        it('falls back to tp_customer_id when tp_account_url is absent', () => {
            const connection: WorkableConnectionLike = {
                tp_customer_id: 'my-org',
            };
            expect(extractWorkableSubdomain(connection)).toBe('my-org');
        });

        it('returns undefined when no valid subdomain is found', () => {
            expect(extractWorkableSubdomain(null)).toBeUndefined();
            expect(extractWorkableSubdomain(undefined)).toBeUndefined();
            expect(extractWorkableSubdomain({})).toBeUndefined();
            expect(extractWorkableSubdomain({ app: { app_config: { org_url: '   ' } } })).toBeUndefined();
        });
    });

    describe('getWorkableBaseUrl', () => {
        it('builds the subdomain-scoped SPI v3 base URL', () => {
            const connection: WorkableConnectionLike = {
                app: { app_config: { org_url: 'acme' } },
            };
            expect(getWorkableBaseUrl(connection)).toBe(`https://acme.workable.com${WORKABLE_API_PATH}`);
        });

        it('throws a descriptive error when subdomain is missing', () => {
            expect(() => getWorkableBaseUrl({})).toThrow(/Workable account URL or subdomain is required/);
        });
    });

    describe('getWorkableAuthHeaders', () => {
        it('generates standard Bearer auth headers', () => {
            expect(getWorkableAuthHeaders('mock_token_123')).toEqual({
                Authorization: 'Bearer mock_token_123',
                Accept: 'application/json',
                'Content-Type': 'application/json',
            });
        });

        it('handles null or undefined token gracefully', () => {
            expect(getWorkableAuthHeaders(null).Authorization).toBe('Bearer ');
            expect(getWorkableAuthHeaders(undefined).Authorization).toBe('Bearer ');
        });
    });

    describe('extractWorkableCollection', () => {
        it('returns raw array directly when input is an array', () => {
            const items = [{ id: '1' }, { id: '2' }];
            expect(extractWorkableCollection(items, 'candidates')).toEqual(items);
        });

        it('extracts collection by key from an envelope object', () => {
            const envelope = { candidates: [{ id: 'c1' }, { id: 'c2' }], paging: {} };
            expect(extractWorkableCollection(envelope, 'candidates')).toEqual([{ id: 'c1' }, { id: 'c2' }]);
        });

        it('falls back to .data array if present', () => {
            const envelope = { data: [{ id: 'j1' }] };
            expect(extractWorkableCollection(envelope, 'jobs')).toEqual([{ id: 'j1' }]);
        });

        it('returns empty array when key is not found or input is null', () => {
            expect(extractWorkableCollection(null, 'jobs')).toEqual([]);
            expect(extractWorkableCollection(undefined, 'jobs')).toEqual([]);
            expect(extractWorkableCollection({ other: [1, 2] }, 'jobs')).toEqual([]);
        });
    });

    describe('extractWorkableResource', () => {
        it('extracts single resource by key from envelope', () => {
            const payload = { candidate: { id: 'c1', firstname: 'Jane' } };
            expect(extractWorkableResource(payload, 'candidate')).toEqual({ id: 'c1', firstname: 'Jane' });
        });

        it('falls back to .data property', () => {
            const payload = { data: { id: 'j1', title: 'Engineer' } };
            expect(extractWorkableResource(payload, 'job')).toEqual({ id: 'j1', title: 'Engineer' });
        });

        it('returns raw object when key is omitted or not matching', () => {
            const raw = { id: 'x1', status: 'open' };
            expect(extractWorkableResource(raw)).toEqual(raw);
        });
    });

    describe('nextWorkableCursor', () => {
        it('resolves cursor from paging.next_id', () => {
            expect(nextWorkableCursor({ paging: { next_id: 12345 } })).toBe('12345');
        });

        it('parses since_id parameter from paging.next URL', () => {
            const payload = {
                paging: { next: 'https://acme.workable.com/spi/v3/candidates?limit=50&since_id=cursor_abc' },
            };
            expect(nextWorkableCursor(payload)).toBe('cursor_abc');
        });

        it('parses after_id parameter from paging.next URL', () => {
            const payload = {
                paging: { next: 'https://acme.workable.com/spi/v3/jobs?limit=50&after_id=job_after' },
            };
            expect(nextWorkableCursor(payload)).toBe('job_after');
        });

        it('parses cursor parameter from paging.next URL', () => {
            const payload = {
                paging: { next: 'https://acme.workable.com/spi/v3/offers?limit=50&cursor=offer_cur' },
            };
            expect(nextWorkableCursor(payload)).toBe('offer_cur');
        });

        it('returns plain string when next is not a full URL', () => {
            expect(nextWorkableCursor({ paging: { next: 'opaque_cursor_token' } })).toBe('opaque_cursor_token');
        });

        it('returns undefined when paging is absent or empty', () => {
            expect(nextWorkableCursor(null)).toBeUndefined();
            expect(nextWorkableCursor({})).toBeUndefined();
            expect(nextWorkableCursor({ paging: {} })).toBeUndefined();
        });
    });

    describe('workableNotSupportedBody', () => {
        it('returns message payload', () => {
            expect(workableNotSupportedBody('message')).toEqual({
                status: 'ok',
                message: 'This endpoint is currently not supported',
            });
        });

        it('returns result payload', () => {
            expect(workableNotSupportedBody('result')).toEqual({
                status: 'ok',
                result: 'This endpoint is currently not supported',
            });
        });
    });

    describe('requestWorkable', () => {
        it('constructs correct URL and sends Bearer authorization header', async () => {
            mockedAxios.mockResolvedValueOnce({ data: { success: true } } as never);

            const connection = {
                id: 'conn-1',
                tp_access_token: 'valid_bearer_token',
                app: { app_config: { org_url: 'groove' } },
            } as any;

            await requestWorkable({
                connection,
                method: 'get',
                path: 'candidates/cand_100',
                params: { expand: 'true' },
            });

            expect(mockedAxios).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'get',
                    url: `https://groove.workable.com${WORKABLE_API_PATH}/candidates/cand_100`,
                    headers: expect.objectContaining({
                        Authorization: 'Bearer valid_bearer_token',
                    }),
                    params: { expand: 'true' },
                }),
            );
        });

        it('strips redundant spi/v3 prefix in path', async () => {
            mockedAxios.mockResolvedValueOnce({ data: [] } as never);

            const connection = {
                id: 'conn-1',
                tp_access_token: 'tok',
                tp_account_url: 'https://acme.workable.com',
            } as any;

            await requestWorkable({
                connection,
                method: 'get',
                path: '/spi/v3/jobs',
            });

            expect(mockedAxios).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: `https://acme.workable.com${WORKABLE_API_PATH}/jobs`,
                }),
            );
        });
    });
});
