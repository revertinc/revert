import axios from 'axios';
import {
    getWorkableBaseUrl,
    getWorkableAuthHeaders,
    extractWorkableCollection,
    extractWorkableResource,
    nextWorkableCursor,
    requestWorkable,
    workableNotSupportedBody,
    WORKABLE_API_PATH,
} from './workable';
import { preprocessUnifyObject } from '../crm/transform/preprocess';
import { disunifyAtsObject } from '../crm/transform/disunify';
import { AtsStandardObjects } from '../../constants/common';
import { TP_ID } from '@prisma/client';
import workableAuthHandler from '../../routes/v1/ats/authHandlers/workable';
import { xprisma } from '../../prisma/client';
import processOAuthResult from '../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../helpers/webhooks/connection';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

jest.mock('../../helpers/logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
    logDebug: jest.fn(),
}));

jest.mock('../../redis/client', () => ({
    get: jest.fn(),
    set: jest.fn(),
    setEx: jest.fn(),
}));

jest.mock('../../helpers/auth/processOAuthResult', () => jest.fn());
jest.mock('../../helpers/webhooks/connection', () => jest.fn());

jest.mock('../../prisma/client', () => ({
    xprisma: {
        connections: {
            upsert: jest.fn().mockResolvedValue({ id: 'conn-1' }),
        },
    },
}));

jest.mock('../crm/transform/transformSchemaMapping', () => ({
    transformModelToFieldMapping: jest.fn().mockImplementation(async ({ unifiedObj }) => unifiedObj || {}),
    transformFieldMappingToModel: jest.fn().mockImplementation(async ({ obj }) => obj || {}),
}));

describe('Workable ATS Integration Suite', () => {
    describe('getWorkableBaseUrl', () => {
        it('should correctly format subdomain only', () => {
            const connection: any = {
                app: {
                    app_config: {
                        org_url: 'acme-corp',
                    },
                },
            };
            const url = getWorkableBaseUrl(connection);
            expect(url).toBe(`https://acme-corp.workable.com${WORKABLE_API_PATH}`);
        });

        it('should correctly format full host without protocol', () => {
            const connection: any = {
                app: {
                    app_config: {
                        org_url: 'acme-corp.workable.com',
                    },
                },
            };
            const url = getWorkableBaseUrl(connection);
            expect(url).toBe(`https://acme-corp.workable.com${WORKABLE_API_PATH}`);
        });

        it('should correctly format full https URL', () => {
            const connection: any = {
                tp_account_url: 'https://initech.workable.com',
            };
            const url = getWorkableBaseUrl(connection);
            expect(url).toBe(`https://initech.workable.com${WORKABLE_API_PATH}`);
        });

        it('should handle URL that already contains /spi/v3 and trailing slash', () => {
            const connection: any = {
                tp_account_url: 'https://initech.workable.com/spi/v3/',
            };
            const url = getWorkableBaseUrl(connection);
            expect(url).toBe(`https://initech.workable.com${WORKABLE_API_PATH}`);
        });

        it('should prioritize connection.tp_account_url over app_config', () => {
            const connection: any = {
                tp_account_url: 'override.workable.com',
                app: {
                    app_config: {
                        org_url: 'fallback.workable.com',
                    },
                },
            };
            const url = getWorkableBaseUrl(connection);
            expect(url).toBe(`https://override.workable.com${WORKABLE_API_PATH}`);
        });

        it('should throw an error when no account URL or subdomain is provided', () => {
            const connection: any = {
                app: {
                    app_config: {},
                },
            };
            expect(() => getWorkableBaseUrl(connection)).toThrow(/Workable account URL or subdomain is required/);
        });
    });

    describe('getWorkableAuthHeaders', () => {
        it('should generate valid Bearer auth headers', () => {
            const headers = getWorkableAuthHeaders('mock-access-token-123');
            expect(headers).toEqual({
                Authorization: 'Bearer mock-access-token-123',
                Accept: 'application/json',
                'Content-Type': 'application/json',
            });
        });

        it('should handle empty token gracefully', () => {
            const headers = getWorkableAuthHeaders(undefined);
            expect(headers.Authorization).toBe('Bearer ');
        });
    });

    describe('extractWorkableCollection', () => {
        it('should return array as-is when input is array', () => {
            const input = [{ id: '1' }, { id: '2' }];
            expect(extractWorkableCollection(input, 'candidates')).toEqual(input);
        });

        it('should extract collection by specific key', () => {
            const input = { candidates: [{ id: 'c1' }, { id: 'c2' }] };
            expect(extractWorkableCollection(input, 'candidates')).toEqual([{ id: 'c1' }, { id: 'c2' }]);
        });

        it('should fallback to data property if present', () => {
            const input = { data: [{ id: 'd1' }] };
            expect(extractWorkableCollection(input, 'jobs')).toEqual([{ id: 'd1' }]);
        });

        it('should return empty array for invalid or non-matching payload', () => {
            expect(extractWorkableCollection(null, 'jobs')).toEqual([]);
            expect(extractWorkableCollection(undefined, 'jobs')).toEqual([]);
            expect(extractWorkableCollection({ other_key: [1, 2] }, 'jobs')).toEqual([]);
        });
    });

    describe('extractWorkableResource', () => {
        it('should extract resource by specific key', () => {
            const input = { candidate: { id: 'c100', name: 'Alice' } };
            expect(extractWorkableResource(input, 'candidate')).toEqual({ id: 'c100', name: 'Alice' });
        });

        it('should fallback to data property if key not matched', () => {
            const input = { data: { id: 'job-99', title: 'Senior Engineer' } };
            expect(extractWorkableResource(input, 'job')).toEqual({ id: 'job-99', title: 'Senior Engineer' });
        });

        it('should return raw object if neither key nor data matched', () => {
            const input = { id: 'raw-1', custom: 'value' };
            expect(extractWorkableResource(input, 'job')).toEqual(input);
        });
    });

    describe('nextWorkableCursor', () => {
        it('should resolve next cursor from paging.next_id', () => {
            const data = {
                paging: {
                    next_id: 1234567,
                },
            };
            expect(nextWorkableCursor(data)).toBe('1234567');
        });

        it('should parse since_id from paging.next URL', () => {
            const data = {
                paging: {
                    next: 'https://initech.workable.com/spi/v3/candidates?limit=50&since_id=98765',
                },
            };
            expect(nextWorkableCursor(data)).toBe('98765');
        });

        it('should parse after_id from paging.next URL', () => {
            const data = {
                paging: {
                    next: 'https://initech.workable.com/spi/v3/jobs?limit=50&after_id=job_abc',
                },
            };
            expect(nextWorkableCursor(data)).toBe('job_abc');
        });

        it('should parse cursor from paging.next URL', () => {
            const data = {
                paging: {
                    next: 'https://initech.workable.com/spi/v3/offers?cursor=cur_xyz',
                },
            };
            expect(nextWorkableCursor(data)).toBe('cur_xyz');
        });

        it('should return plain string if paging.next is not a full URL', () => {
            const data = {
                paging: {
                    next: 'cursor_token_literal',
                },
            };
            expect(nextWorkableCursor(data)).toBe('cursor_token_literal');
        });

        it('should return undefined when no paging is present', () => {
            expect(nextWorkableCursor({})).toBeUndefined();
            expect(nextWorkableCursor(null)).toBeUndefined();
        });
    });

    describe('requestWorkable', () => {
        it('should build proper url, headers, and call axios', async () => {
            const mockResponse = { data: { success: true } };
            mockedAxios.mockResolvedValueOnce(mockResponse as any);

            const connection: any = {
                tp_access_token: 'secret-token',
                app: {
                    app_config: {
                        org_url: 'demo-company',
                    },
                },
            };

            const res = await requestWorkable({
                connection,
                method: 'get',
                path: 'candidates/123',
                params: { state: 'published' },
            });

            expect(mockedAxios).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'get',
                    url: 'https://demo-company.workable.com/spi/v3/candidates/123',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer secret-token',
                    }),
                    params: { state: 'published' },
                }),
            );
            expect(res).toEqual(mockResponse);
        });
    });

    describe('workableNotSupportedBody', () => {
        it('should return standard message payload', () => {
            expect(workableNotSupportedBody('message')).toEqual({
                status: 'ok',
                message: 'This endpoint is currently not supported',
            });
        });

        it('should return standard result payload', () => {
            expect(workableNotSupportedBody('result')).toEqual({
                status: 'ok',
                result: 'This endpoint is currently not supported',
            });
        });
    });

    describe('preprocessUnifyObject (Normalizers)', () => {
        it('should preprocess Workable Candidate correctly', () => {
            const rawCandidate = {
                id: 'cand_123',
                name: 'John Doe',
                firstname: 'John',
                lastname: 'Doe',
                email: 'john@example.com',
                phone: '+15551234567',
                headline: 'Software Engineer',
                summary: 'Experienced full stack developer',
                created_at: '2026-09-01T10:00:00Z',
                updated_at: '2026-09-05T12:00:00Z',
                job: {
                    shortcode: 'JOB01',
                    title: 'Backend Engineer',
                },
                stage: 'Hired',
            };

            const preprocessed = preprocessUnifyObject({
                obj: rawCandidate,
                tpId: TP_ID.workable,
                objType: AtsStandardObjects.candidate,
            });

            expect(preprocessed.id).toBe('cand_123');
            expect(preprocessed.first_name).toBe('John');
            expect(preprocessed.last_name).toBe('Doe');
            expect(preprocessed.name).toBe('John Doe');
            expect(preprocessed.email_addresses[0].value).toBe('john@example.com');
            expect(preprocessed.phone_numbers[0].value).toBe('+15551234567');
            expect(preprocessed.title).toBe('Software Engineer');
            expect(preprocessed.created_at).toBe('2026-09-01T10:00:00Z');
            expect(preprocessed.updated_at).toBe('2026-09-05T12:00:00Z');
        });

        it('should preprocess Workable Job correctly', () => {
            const rawJob = {
                id: 'job_456',
                shortcode: 'JOB02',
                title: 'Engineering Manager',
                code: 'ENG-MGR-01',
                state: 'published',
                department: 'Engineering',
                department_id: 'dept_789',
                created_at: '2026-08-15T09:00:00Z',
                updated_at: '2026-08-20T11:00:00Z',
            };

            const preprocessed = preprocessUnifyObject({
                obj: rawJob,
                tpId: TP_ID.workable,
                objType: AtsStandardObjects.job,
            });

            expect(preprocessed.id).toBe('JOB02');
            expect(preprocessed.name).toBe('Engineering Manager');
            expect(preprocessed.code).toBe('ENG-MGR-01');
            expect(preprocessed.status).toBe('open');
            expect(preprocessed.departments[0].name).toBe('Engineering');
            expect(preprocessed.created_at).toBe('2026-08-15T09:00:00Z');
            expect(preprocessed.updated_at).toBe('2026-08-20T11:00:00Z');
        });

        it('should preprocess Workable Department correctly', () => {
            const rawDept = {
                id: 101,
                name: 'Product Design',
            };

            const preprocessed = preprocessUnifyObject({
                obj: rawDept,
                tpId: TP_ID.workable,
                objType: AtsStandardObjects.department,
            });

            expect(preprocessed.id).toBe('101');
            expect(preprocessed.name).toBe('Product Design');
        });

        it('should preprocess Workable Offer correctly', () => {
            const rawOffer = {
                id: 'off_999',
                candidate: { id: 'cand_123' },
                job: { shortcode: 'JOB01' },
                status: 'accepted',
                created_at: '2026-09-02T10:00:00Z',
                sent_at: '2026-09-03T11:00:00Z',
                resolved_at: '2026-09-04T15:00:00Z',
            };

            const preprocessed = preprocessUnifyObject({
                obj: rawOffer,
                tpId: TP_ID.workable,
                objType: AtsStandardObjects.offer,
            });

            expect(preprocessed.id).toBe('off_999');
            expect(preprocessed.candidate_id).toBe('cand_123');
            expect(preprocessed.job_id).toBe('JOB01');
            expect(preprocessed.status).toBe('accepted');
            expect(preprocessed.created_at).toBe('2026-09-02T10:00:00Z');
            expect(preprocessed.sent_at).toBe('2026-09-03T11:00:00Z');
            expect(preprocessed.resolved_at).toBe('2026-09-04T15:00:00Z');
        });
    });

    describe('disunifyAtsObject (Candidate creation payload)', () => {
        it('should disunify unified candidate into Workable candidate structure', async () => {
            const unifiedCandidate = {
                first_name: 'Jane',
                last_name: 'Smith',
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                phone_number: '+1234567890',
                title: 'Staff Architect',
                summary: 'Passionate software architect',
            };

            const disunified = await disunifyAtsObject({
                obj: unifiedCandidate,
                tpId: TP_ID.workable,
                objType: AtsStandardObjects.candidate,
            });

            expect(disunified.candidate).toBeDefined();
            expect(disunified.candidate.firstname).toBe('Jane');
            expect(disunified.candidate.lastname).toBe('Smith');
            expect(disunified.candidate.name).toBe('Jane Smith');
            expect(disunified.candidate.email).toBe('jane.smith@example.com');
            expect(disunified.candidate.phone).toBe('+1234567890');
            expect(disunified.candidate.headline).toBe('Staff Architect');
            expect(disunified.candidate.summary).toBe('Passionate software architect');
        });
    });

    describe('WorkableAuthHandler', () => {
        it('should handle basic auth and save active connection', async () => {
            const mockProps: any = {
                code: 'workable-api-token-xyz',
                tenantId: 'tenant-123',
                revertPublicKey: 'pub-token-abc',
                account: {
                    apps: [{ id: 'app-1' }],
                },
                integrationId: TP_ID.workable,
                svixAppId: 'svix-123',
                environmentId: 'env-123',
                tenantSecretToken: 'sec-123',
                response: {},
            };

            await workableAuthHandler.handleBasicAuth(mockProps);

            expect(xprisma.connections.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'tenant-123' },
                    create: expect.objectContaining({
                        tp_access_token: 'workable-api-token-xyz',
                        tp_id: TP_ID.workable,
                        t_id: 'tenant-123',
                    }),
                }),
            );
            expect(sendConnectionAddedEvent).toHaveBeenCalledWith(
                'svix-123',
                'tenant-123',
                TP_ID.workable,
                'workable-api-token-xyz',
                'Workable user',
            );
            expect(processOAuthResult).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: true,
                    tenantId: 'tenant-123',
                }),
            );
        });
    });
});
