import { jest, describe, expect, it, beforeEach } from '@jest/globals';
import axios from 'axios';
import { TP_ID } from '@prisma/client';
import { AtsStandardObjects } from '../../constants/common';
import { preprocessUnifyObject } from '../../helpers/crm/transform/preprocess';
import { atsFields } from '../../prisma/fields';
import {
    buildWorkableParams,
    getWorkableBaseUrl,
    getWorkableCollection,
    getWorkableHeaders,
    getWorkableNextCursor,
    getWorkableResource,
    getWorkableSubdomain,
    requestWorkable,
} from './workable';

jest.mock('axios', () => jest.fn());

const mockedAxios = axios as any;

const mockConnection = (appConfig?: Record<string, any>, accountUrl?: string, connectionConfig?: Record<string, any>) =>
    ({
        tp_access_token: 'workable-token',
        tp_account_url: accountUrl,
        app_config: connectionConfig,
        app: {
            app_config: appConfig,
        },
    }) as any;

describe('Workable ATS helper', () => {
    describe('getWorkableSubdomain', () => {
        it('returns a bare subdomain from app_config.subdomain', () => {
            expect(getWorkableSubdomain(mockConnection({ subdomain: 'acme' }))).toBe('acme');
        });

        it('extracts the subdomain from a full org_url', () => {
            expect(getWorkableSubdomain(mockConnection({ org_url: 'https://acme.workable.com' }))).toBe('acme');
        });

        it('extracts the subdomain from an org_url that already contains the API path', () => {
            expect(getWorkableSubdomain(mockConnection({ org_url: 'https://acme.workable.com/spi/v3' }))).toBe('acme');
        });

        it('falls back to tp_account_url when no app config is present', () => {
            expect(getWorkableSubdomain(mockConnection(undefined, 'https://acme.workable.com/'))).toBe('acme');
        });

        it('prefers the connection-level config over the app-level config', () => {
            expect(
                getWorkableSubdomain(mockConnection({ subdomain: 'app-level' }, undefined, { subdomain: 'conn-level' })),
            ).toBe('conn-level');
        });

        it('throws when no subdomain is configured anywhere', () => {
            expect(() => getWorkableSubdomain(mockConnection(undefined, undefined))).toThrow(
                'Workable account subdomain is required',
            );
        });
    });

    describe('getWorkableBaseUrl', () => {
        it('builds the SPI v3 URL from a bare subdomain', () => {
            expect(getWorkableBaseUrl(mockConnection({ subdomain: 'acme' }))).toBe('https://acme.workable.com/spi/v3');
        });

        it('normalizes configured host URLs without duplicating the SPI path', () => {
            expect(getWorkableBaseUrl(mockConnection({ org_url: 'https://acme.workable.com/spi/v3/' }))).toBe(
                'https://acme.workable.com/spi/v3',
            );
        });
    });

    describe('getWorkableHeaders', () => {
        it('builds bearer auth headers for the stored API token', () => {
            expect(getWorkableHeaders('secret-token')).toEqual({
                Authorization: 'Bearer secret-token',
                Accept: 'application/json',
                'Content-Type': 'application/json',
            });
        });
    });

    describe('buildWorkableParams', () => {
        it('maps pageSize to limit and cursor to max_id', () => {
            expect(buildWorkableParams({ pageSize: 25, cursor: '987' })).toEqual({ limit: 25, max_id: '987' });
        });

        it('passes through extra fields and omits an invalid pageSize', () => {
            expect(buildWorkableParams({ pageSize: NaN, fields: { stage: 'applied' } })).toEqual({ stage: 'applied' });
        });

        it('returns an empty object when nothing is provided', () => {
            expect(buildWorkableParams({})).toEqual({});
        });
    });

    describe('getWorkableCollection', () => {
        it('extracts collections from keyed Workable responses', () => {
            expect(getWorkableCollection({ candidates: [{ id: 'candidate-1' }] }, 'candidates')).toEqual([
                { id: 'candidate-1' },
            ]);
            expect(getWorkableCollection({ jobs: [{ shortcode: 'ENG-1' }] }, 'jobs')).toEqual([{ shortcode: 'ENG-1' }]);
        });

        it('extracts collections from data-wrapped and raw array responses', () => {
            expect(getWorkableCollection({ data: [{ id: 'candidate-2' }] }, 'candidates')).toEqual([
                { id: 'candidate-2' },
            ]);
            expect(getWorkableCollection([{ id: 'candidate-3' }], 'candidates')).toEqual([{ id: 'candidate-3' }]);
        });

        it('returns an empty array for payloads without the collection', () => {
            expect(getWorkableCollection({}, 'candidates')).toEqual([]);
            expect(getWorkableCollection(undefined, 'candidates')).toEqual([]);
        });
    });

    describe('getWorkableResource', () => {
        it('extracts resources from wrapped and unwrapped payloads', () => {
            expect(getWorkableResource({ candidate: { id: 'candidate-1' } }, 'candidate')).toEqual({
                id: 'candidate-1',
            });
            expect(getWorkableResource({ id: 'candidate-2' }, 'candidate')).toEqual({ id: 'candidate-2' });
        });
    });

    describe('getWorkableNextCursor', () => {
        it('extracts the max_id cursor from a full paging.next URL', () => {
            expect(
                getWorkableNextCursor({
                    paging: { next: 'https://acme.workable.com/spi/v3/candidates?limit=25&max_id=12345' },
                }),
            ).toBe('12345');
        });

        it('extracts a since_id cursor when max_id is absent', () => {
            expect(getWorkableNextCursor({ paging: { next: 'https://acme.workable.com/spi/v3/jobs?since_id=777' } })).toBe(
                '777',
            );
        });

        it('passes through a bare cursor value and supported next fields', () => {
            expect(getWorkableNextCursor({ paging: { next: 'next-id' } })).toBe('next-id');
            expect(getWorkableNextCursor({ paging: { next_id: 'next-id' } })).toBe('next-id');
            expect(getWorkableNextCursor({ next: 'next-id' })).toBe('next-id');
        });

        it('returns undefined when there is no next page', () => {
            expect(getWorkableNextCursor({})).toBeUndefined();
            expect(getWorkableNextCursor({ paging: {} })).toBeUndefined();
        });
    });

    describe('requestWorkable', () => {
        beforeEach(() => {
            mockedAxios.mockReset();
            mockedAxios.mockResolvedValue({ data: { jobs: [] } });
        });

        it('calls the subdomain SPI URL with bearer headers and params', async () => {
            await requestWorkable({
                connection: mockConnection({ subdomain: 'acme' }),
                method: 'get',
                path: '/jobs',
                params: { limit: 10 },
            });

            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'get',
                url: 'https://acme.workable.com/spi/v3/jobs',
                headers: {
                    Authorization: 'Bearer workable-token',
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                data: undefined,
                params: { limit: 10 },
            });
        });

        it('normalizes leading slashes in the request path', async () => {
            await requestWorkable({
                connection: mockConnection({ org_url: 'https://acme.workable.com' }),
                method: 'post',
                path: 'jobs/ENG-1/candidates',
                data: JSON.stringify({ candidate: { firstname: 'Ada' }, sourced: true }),
            });

            expect(mockedAxios).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: 'https://acme.workable.com/spi/v3/jobs/ENG-1/candidates',
                }),
            );
        });
    });
});

describe('Workable unified field mapping', () => {
    it('preprocesses a Workable candidate into the unified shape', () => {
        const processed: any = preprocessUnifyObject({
            obj: {
                id: 42,
                firstname: 'Ada',
                lastname: 'Lovelace',
                email: 'ada@example.com',
                phone: '+1-555-0100',
                job: { shortcode: 'ENG-1', title: 'Engineer' },
                last_activity_at: '2026-05-01T00:00:00Z',
                updated_at: '2026-05-02T00:00:00Z',
            },
            tpId: TP_ID.workable as any,
            objType: AtsStandardObjects.candidate,
        });

        expect(processed.email_addresses).toEqual([{ value: 'ada@example.com', type: undefined }]);
        expect(processed.phone_numbers).toEqual([{ value: '+1-555-0100', type: undefined }]);
        expect(processed.application_ids).toEqual(['ENG-1']);
        expect(processed.last_activity).toBe('2026-05-01T00:00:00Z');
    });

    it('preprocesses a Workable job: state is normalized and department becomes a list', () => {
        const published: any = preprocessUnifyObject({
            obj: { shortcode: 'ENG-1', title: 'Engineer', state: 'published', department: 'Engineering' },
            tpId: TP_ID.workable as any,
            objType: AtsStandardObjects.job,
        });
        expect(published.state).toBe('open');
        expect(published.departments).toEqual([{ name: 'Engineering' }]);

        const archived: any = preprocessUnifyObject({
            obj: { shortcode: 'ENG-2', title: 'Designer', state: 'archived' },
            tpId: TP_ID.workable as any,
            objType: AtsStandardObjects.job,
        });
        expect(archived.state).toBe('closed');
        expect(archived.departments).toBeUndefined();
    });

    it('preprocesses a Workable offer: application, job and start date are derived', () => {
        const processed: any = preprocessUnifyObject({
            obj: { candidate_id: 'candidate-1', job: { shortcode: 'ENG-1' }, start_date: '2026-06-01' },
            tpId: TP_ID.workable as any,
            objType: AtsStandardObjects.offer,
        });

        expect(processed.application_id).toBe('candidate-1');
        expect(processed.job_id).toBe('ENG-1');
        expect(processed.starts_at).toBe('2026-06-01');
    });

    it('defines a workable source field for every ATS field mapping', () => {
        Object.values(atsFields).forEach((fields) => {
            fields.forEach((field: any) => {
                expect(
                    Object.prototype.hasOwnProperty.call(field.source_field_name, TP_ID.workable),
                ).toBe(true);
            });
        });
    });

    it('maps the key Workable source fields for jobs and candidates', () => {
        const sourceFor = (obj: AtsStandardObjects, target: string) =>
            (atsFields[obj] as any[]).find((field) => field.target_field_name === target)?.source_field_name[
                TP_ID.workable
            ];

        expect(sourceFor(AtsStandardObjects.candidate, 'first_name')).toBe('firstname');
        expect(sourceFor(AtsStandardObjects.candidate, 'last_name')).toBe('lastname');
        expect(sourceFor(AtsStandardObjects.candidate, 'photo_url')).toBe('image_url');
        expect(sourceFor(AtsStandardObjects.job, 'id')).toBe('shortcode');
        expect(sourceFor(AtsStandardObjects.job, 'name')).toBe('title');
        expect(sourceFor(AtsStandardObjects.job, 'status')).toBe('state');
        expect(sourceFor(AtsStandardObjects.offer, 'starts_at')).toBe('starts_at');
        expect(sourceFor(AtsStandardObjects.department, 'name')).toBe('name');
    });
});
