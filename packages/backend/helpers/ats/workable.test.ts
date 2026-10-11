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
} from './workable';
import { preprocessUnifyObject } from '../crm/transform/preprocess';
import { AtsStandardObjects } from '../../constants/common';
import { TP_ID } from '@prisma/client';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

jest.mock('../logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
    logDebug: jest.fn(),
}));

describe('Workable ATS helpers', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('extractWorkableSubdomain', () => {
        it('accepts a bare subdomain from app_config.org_url', () => {
            const connection: any = { app: { app_config: { org_url: 'acme-corp' } } };
            expect(extractWorkableSubdomain(connection)).toBe('acme-corp');
        });

        it('accepts a full host and a full URL', () => {
            expect(extractWorkableSubdomain({ app: { app_config: { org_url: 'acme.workable.com' } } } as any)).toBe(
                'acme',
            );
            expect(
                extractWorkableSubdomain({
                    app: { app_config: { org_url: 'https://acme.workable.com/spi/v3/' } },
                } as any),
            ).toBe('acme');
        });

        it('prefers tp_account_url over tp_customer_id over app_config', () => {
            const connection: any = {
                tp_account_url: 'https://alpha.workable.com',
                tp_customer_id: 'beta',
                app: { app_config: { org_url: 'gamma' } },
            };
            expect(extractWorkableSubdomain(connection)).toBe('alpha');
        });

        it('falls back to tp_customer_id', () => {
            const connection: any = { tp_customer_id: 'acme' };
            expect(extractWorkableSubdomain(connection)).toBe('acme');
        });

        it('returns undefined when nothing usable is configured', () => {
            expect(extractWorkableSubdomain({} as any)).toBeUndefined();
            expect(extractWorkableSubdomain(undefined)).toBeUndefined();
            expect(extractWorkableSubdomain({ app: { app_config: { org_url: '' } } } as any)).toBeUndefined();
        });
    });

    describe('getWorkableBaseUrl', () => {
        it('builds the subdomain-scoped SPI v3 base URL', () => {
            expect(getWorkableBaseUrl({ app: { app_config: { org_url: 'acme' } } } as any)).toBe(
                `https://acme.workable.com${WORKABLE_API_PATH}`,
            );
        });

        it('throws when the subdomain is missing', () => {
            expect(() => getWorkableBaseUrl({} as any)).toThrow(/subdomain is required/);
        });
    });

    describe('getWorkableAuthHeaders', () => {
        it('generates Bearer headers', () => {
            expect(getWorkableAuthHeaders('tok-123')).toEqual({
                Authorization: 'Bearer tok-123',
                Accept: 'application/json',
                'Content-Type': 'application/json',
            });
        });
    });

    describe('extractWorkableCollection / extractWorkableResource', () => {
        it('extracts collections by key and tolerates bare arrays', () => {
            expect(extractWorkableCollection({ candidates: [{ id: 'a' }] }, 'candidates')).toEqual([{ id: 'a' }]);
            expect(extractWorkableCollection([{ id: 'a' }], 'candidates')).toEqual([{ id: 'a' }]);
            expect(extractWorkableCollection({ paging: {} }, 'candidates')).toEqual([]);
        });

        it('extracts single resources by key', () => {
            expect(extractWorkableResource({ candidate: { id: 'a' } }, 'candidate')).toEqual({ id: 'a' });
            expect(extractWorkableResource({ id: 'b' }, undefined)).toEqual({ id: 'b' });
            expect(extractWorkableResource({ data: { id: 'c' } }, 'other')).toEqual({ id: 'c' });
        });
    });

    describe('nextWorkableCursor', () => {
        it('extracts since_id from the paging.next URL', () => {
            const data = {
                paging: { next: `https://www.workable.com/spi/v3/accounts/acme/candidates?limit=50&since_id=abc123` },
            };
            expect(nextWorkableCursor(data)).toBe('abc123');
        });

        it('supports paging.next_id and returns undefined when absent', () => {
            expect(nextWorkableCursor({ paging: { next_id: 42 } })).toBe('42');
            expect(nextWorkableCursor({})).toBeUndefined();
            expect(nextWorkableCursor(null)).toBeUndefined();
        });
    });

    describe('requestWorkable', () => {
        it('calls the subdomain-scoped URL with a Bearer token', async () => {
            mockedAxios.mockResolvedValueOnce({ data: {} } as any);
            const connection: any = {
                tp_access_token: 'tok',
                app: { app_config: { org_url: 'acme' } },
            };
            await requestWorkable({ connection, method: 'get', path: '/jobs', params: { limit: 1 } });
            expect(mockedAxios).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'get',
                    url: `https://acme.workable.com${WORKABLE_API_PATH}/jobs`,
                    headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
                    params: { limit: 1 },
                }),
            );
        });
    });
});

describe('Workable preprocess (unify) normalizers', () => {
    it('splits name into first/last and wraps scalar email/phone for candidates', () => {
        const obj = {
            id: 'c1',
            name: 'Jane Mary Doe',
            firstname: undefined,
            headline: 'Ops Manager',
            email: 'jane@doe.com',
            phone: '555-0100',
            address: '1 Main St',
            account: { subdomain: 'acme', name: 'Acme Inc' },
            job: { shortcode: 'GROOV005', title: 'Office Manager' },
            stage: 'Applied',
            image_url: 'http://img',
            tags: ['a'],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
        };
        const out: any = preprocessUnifyObject({
            obj,
            tpId: TP_ID.workable,
            objType: AtsStandardObjects.candidate,
        });
        expect(out.first_name).toBe('Jane');
        expect(out.last_name).toBe('Mary Doe');
        expect(out.title).toBe('Ops Manager');
        expect(out.company).toBe('Acme Inc');
        expect(out.email_addresses).toEqual([{ value: 'jane@doe.com', type: undefined }]);
        expect(out.phone_numbers).toEqual([{ value: '555-0100', type: undefined }]);
        expect(out.addresses).toEqual([{ value: '1 Main St', type: undefined }]);
        expect(out.application_ids).toEqual(['GROOV005']);
        expect(out.applications[0].job_post_id).toBe('GROOV005');
        expect(out.photo_url).toBe('http://img');
        expect(out.last_activity).toBe('2024-01-02T00:00:00Z');
    });

    it('maps job state and title', () => {
        const out: any = preprocessUnifyObject({
            obj: {
                id: '61884e2',
                shortcode: 'GROOV003',
                title: 'Sales Intern',
                state: 'published',
                confidential: false,
                department: 'Sales',
                description: 'desc',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            },
            tpId: TP_ID.workable,
            objType: AtsStandardObjects.job,
        });
        expect(out.id).toBe('GROOV003');
        expect(out.name).toBe('Sales Intern');
        expect(out.status).toBe('open');
        expect(out.departments).toEqual([{ name: 'Sales' }]);
        expect(out.notes).toBe('desc');
    });

    it('maps offer state to the unified status vocabulary', () => {
        const out: any = preprocessUnifyObject({
            obj: {
                id: 'o1',
                state: 'accepted',
                candidate: { id: 'c1', name: 'Jane' },
                document_variables: [
                    { document_variable: { name: 'Start Date', slug: 'start_date' }, value: { body: '2024-02-01' } },
                ],
                created_at: '2024-01-01T00:00:00Z',
            },
            tpId: TP_ID.workable,
            objType: AtsStandardObjects.offer,
        });
        expect(out.status).toBe('accepted');
        expect(out.candidate_id).toBe('c1');
        expect(out.application_id).toBe('c1');
        expect(out.starts_at).toBe('2024-02-01');
    });

    it('maps departments directly (id/name/parent_id pass through)', () => {
        const out: any = preprocessUnifyObject({
            obj: { id: 'd1', name: 'Engineering', parent_id: null },
            tpId: TP_ID.workable,
            objType: AtsStandardObjects.department,
        });
        expect(out.name).toBe('Engineering');
    });
});
