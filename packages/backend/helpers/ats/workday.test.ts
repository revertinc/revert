import { describe, expect, it, jest } from '@jest/globals';
import { TP_ID } from '@prisma/client';
import { AtsStandardObjects } from '../../constants/common';

process.env.PGSQL_URL = 'postgresql://postgres:postgres@localhost:5432/test';

jest.mock('@prisma/client', () => {
    const actual = jest.requireActual('@prisma/client') as any;
    return {
        ...actual,
        PrismaClient: jest.fn().mockImplementation(() => ({
            schemas: {
                findFirst: jest.fn<any>().mockResolvedValue({
                    id: 'mock-schema-id',
                    fieldMappings: [
                        { target_field_name: 'first_name', source_field_name: 'firstName' },
                        { target_field_name: 'last_name', source_field_name: 'lastName' },
                    ],
                }),
            },
        })),
    };
});

import { preprocessUnifyObject } from '../crm/transform/preprocess';
import { disunifyAtsObject } from '../crm/transform/disunify';

import {
    WORKDAY_NOT_SUPPORTED_MESSAGE,
    WORKDAY_NOT_SUPPORTED_RESULT,
    appendQueryParams,
    extractWorkdayCollection,
    extractWorkdayResource,
    getWorkdayAuthHeaders,
    joinWorkdayUrl,
    nextWorkdayCursor,
    parseWorkdayOrgUrl,
    resolveWorkdayOrgUrl,
    resolveWorkdayProxyUrl,
    resolveWorkdayResourceUrl,
    hasWorkdayTenantUrl,
    missingWorkdayTenantMessage,
    stripTrailingSlash,
    workdayListPaging,
    workdayNotSupportedBody,
} from './workday';

describe('Workday tenant URL handling', () => {
    it('strips trailing slashes', () => {
        expect(stripTrailingSlash('https://impl.workday.com/acme/')).toBe('https://impl.workday.com/acme');
        expect(stripTrailingSlash('https://impl.workday.com/acme///')).toBe('https://impl.workday.com/acme');
    });

    it('parses a full recruiting REST base and derives OAuth URLs', () => {
        const parsed = parseWorkdayOrgUrl('https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme_tenant/');
        expect(parsed.origin).toBe('https://wd2-impl-services1.workday.com');
        expect(parsed.tenant).toBe('acme_tenant');
        expect(parsed.recruitingBase).toBe('https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme_tenant');
        expect(parsed.staffingBase).toBe('https://wd2-impl-services1.workday.com/ccx/api/staffing/v1/acme_tenant');
        expect(parsed.tokenUrl).toBe('https://wd2-impl-services1.workday.com/ccx/oauth2/acme_tenant/token');
        expect(parsed.authorizeUrl).toBe('https://wd2-impl-services1.workday.com/ccx/oauth2/acme_tenant/authorize');
    });

    it('parses a full staffing REST base and derives recruiting and OAuth URLs', () => {
        const parsed = parseWorkdayOrgUrl('https://wd2-impl-services1.workday.com/ccx/api/staffing/v1/acme_tenant');
        expect(parsed.tenant).toBe('acme_tenant');
        expect(parsed.recruitingBase).toBe('https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme_tenant');
        expect(parsed.staffingBase).toBe('https://wd2-impl-services1.workday.com/ccx/api/staffing/v1/acme_tenant');
        expect(parsed.tokenUrl).toBe('https://wd2-impl-services1.workday.com/ccx/oauth2/acme_tenant/token');
        expect(parsed.authorizeUrl).toBe('https://wd2-impl-services1.workday.com/ccx/oauth2/acme_tenant/authorize');
    });

    it('parses the generic REST base /ccx/api/v1/{tenant}', () => {
        const parsed = parseWorkdayOrgUrl('https://wd2-impl-services1.workday.com/ccx/api/v1/acme_tenant');
        expect(parsed.tenant).toBe('acme_tenant');
        expect(parsed.recruitingBase).toBe('https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme_tenant');
        expect(parsed.staffingBase).toBe('https://wd2-impl-services1.workday.com/ccx/api/staffing/v1/acme_tenant');
        expect(parsed.tokenUrl).toBe('https://wd2-impl-services1.workday.com/ccx/oauth2/acme_tenant/token');
        expect(parsed.authorizeUrl).toBe('https://wd2-impl-services1.workday.com/ccx/oauth2/acme_tenant/authorize');
    });

    it('parses a token endpoint and derives bases', () => {
        const parsed = parseWorkdayOrgUrl('https://wd2-impl-services1.workday.com/ccx/oauth2/acme_tenant/token');
        expect(parsed.tenant).toBe('acme_tenant');
        expect(parsed.tokenUrl).toBe('https://wd2-impl-services1.workday.com/ccx/oauth2/acme_tenant/token');
        expect(parsed.recruitingBase).toBe('https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme_tenant');
        expect(parsed.staffingBase).toBe('https://wd2-impl-services1.workday.com/ccx/api/staffing/v1/acme_tenant');
    });

    it('parses a host + tenant URL shape', () => {
        const parsed = parseWorkdayOrgUrl('https://services.workday.com/acme_tenant');
        expect(parsed.tenant).toBe('acme_tenant');
        expect(parsed.recruitingBase).toBe('https://services.workday.com/ccx/api/recruiting/v1/acme_tenant');
        expect(parsed.staffingBase).toBe('https://services.workday.com/ccx/api/staffing/v1/acme_tenant');
    });

    it('handles empty orgUrl safely', () => {
        const parsed = parseWorkdayOrgUrl('', {
            tokenUrl: 'https://auth.workday.com/token',
            authUrl: 'https://auth.workday.com/authorize',
        });
        expect(parsed.origin).toBe('');
        expect(parsed.recruitingBase).toBe('');
        expect(parsed.tokenUrl).toBe('https://auth.workday.com/token');
        expect(parsed.authorizeUrl).toBe('https://auth.workday.com/authorize');
    });

    it('resolves org URL precedence: connection -> connection config -> app config -> env', () => {
        expect(
            resolveWorkdayOrgUrl({
                tp_account_url: 'https://conn.workday.com/t1',
                app_config: { org_url: 'https://conn-cfg.workday.com/t2' },
            }),
        ).toBe('https://conn.workday.com/t1');

        expect(
            resolveWorkdayOrgUrl({
                app_config: { org_url: 'https://conn-cfg.workday.com/t2' },
                app: { app_config: { org_url: 'https://app-cfg.workday.com/t3' } },
            }),
        ).toBe('https://conn-cfg.workday.com/t2');

        expect(
            resolveWorkdayOrgUrl(
                {
                    app: { app_config: { org_url: 'https://app-cfg.workday.com/t3' } },
                },
                'https://env.workday.com/t4',
            ),
        ).toBe('https://app-cfg.workday.com/t3');

        expect(resolveWorkdayOrgUrl({}, 'https://env.workday.com/t4')).toBe('https://env.workday.com/t4');
    });

    it('validates tenant presence', () => {
        expect(hasWorkdayTenantUrl({})).toBe(false);
        expect(hasWorkdayTenantUrl({}, { apiBaseUrl: 'https://env.workday.com' })).toBe(true);
        expect(missingWorkdayTenantMessage()).toContain('Workday tenant URL is not configured');
    });
});

describe('Workday resource URL routing', () => {
    const connection = {
        tp_account_url: 'https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme_tenant',
    };

    it('routes recruiting resources (candidates, jobPostings, jobOffers)', () => {
        expect(resolveWorkdayResourceUrl(connection, 'candidates')).toBe(
            'https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme_tenant/candidates',
        );
        expect(resolveWorkdayResourceUrl(connection, 'candidates', 'cand-123')).toBe(
            'https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme_tenant/candidates/cand-123',
        );
        expect(resolveWorkdayResourceUrl(connection, 'jobPostings')).toBe(
            'https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme_tenant/jobPostings',
        );
        expect(resolveWorkdayResourceUrl(connection, 'jobOffers', 'offer-9')).toBe(
            'https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme_tenant/jobOffers/offer-9',
        );
    });

    it('routes department resources to staffingBase organizations', () => {
        expect(resolveWorkdayResourceUrl(connection, 'organizations')).toBe(
            'https://wd2-impl-services1.workday.com/ccx/api/staffing/v1/acme_tenant/organizations',
        );
        expect(resolveWorkdayResourceUrl(connection, 'organizations', 'dept-42')).toBe(
            'https://wd2-impl-services1.workday.com/ccx/api/staffing/v1/acme_tenant/organizations/dept-42',
        );
    });

    it('appends query string cleanly', () => {
        const url = resolveWorkdayResourceUrl(connection, 'candidates', undefined, 'limit=20&offset=40');
        expect(url).toBe(
            'https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme_tenant/candidates?limit=20&offset=40',
        );
    });

    it('resolves proxy URLs for relative and absolute paths', () => {
        expect(resolveWorkdayProxyUrl(connection, 'workers')).toBe(
            'https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme_tenant/workers',
        );
        expect(resolveWorkdayProxyUrl(connection, 'https://custom.workday.com/api')).toBe(
            'https://custom.workday.com/api',
        );
    });

    it('joins segments without double slashes', () => {
        expect(joinWorkdayUrl('https://example.com/', '/foo/', '/bar')).toBe('https://example.com/foo/bar');
    });
});

describe('Workday headers & pagination', () => {
    it('builds auth headers', () => {
        expect(getWorkdayAuthHeaders('token-xyz')).toEqual({
            Authorization: 'Bearer token-xyz',
            Accept: 'application/json',
            'Content-Type': 'application/json',
        });
    });

    it('computes list paging parameters', () => {
        expect(workdayListPaging(10, '20')).toEqual({
            pagingString: 'limit=10&offset=20',
            offset: 20,
            limit: 10,
        });
        expect(workdayListPaging(undefined, undefined)).toEqual({
            pagingString: '',
            offset: 0,
            limit: undefined,
        });
    });

    it('calculates next cursor based on total or limit', () => {
        expect(nextWorkdayCursor(0, 10, 50, 10)).toBe('10');
        expect(nextWorkdayCursor(40, 10, 50, 10)).toBeUndefined();
        expect(nextWorkdayCursor(0, 10, undefined, 10)).toBe('10');
        expect(nextWorkdayCursor(0, 7, undefined, 10)).toBeUndefined();
        expect(nextWorkdayCursor(0, 0, 50, 10)).toBeUndefined();
    });

    it('extracts collections from various payload formats', () => {
        expect(extractWorkdayCollection([{ id: '1' }])).toEqual({ items: [{ id: '1' }], total: 1 });
        expect(extractWorkdayCollection({ data: [{ id: '2' }], total: 10 })).toEqual({
            items: [{ id: '2' }],
            total: 10,
        });
        expect(extractWorkdayCollection({ results: [{ id: '3' }], total: 5 })).toEqual({
            items: [{ id: '3' }],
            total: 5,
        });
        expect(extractWorkdayCollection(null)).toEqual({ items: [] });
    });

    it('extracts resource data or unwraps object', () => {
        expect(extractWorkdayResource({ data: { id: 'c1', name: 'Alice' } })).toEqual({
            id: 'c1',
            name: 'Alice',
        });
        expect(extractWorkdayResource({ id: 'c2' })).toEqual({ id: 'c2' });
    });

    it('appends query params correctly', () => {
        expect(appendQueryParams('limit=10', { active: true })).toBe('limit=10&active=true');
        expect(appendQueryParams('', { active: true })).toBe('active=true');
        expect(appendQueryParams('limit=10', undefined)).toBe('limit=10');
    });

    it('returns standard unsupported payloads', () => {
        expect(workdayNotSupportedBody('message')).toEqual({
            status: 'ok',
            message: WORKDAY_NOT_SUPPORTED_MESSAGE,
        });
        expect(workdayNotSupportedBody('result')).toEqual({
            status: 'ok',
            result: WORKDAY_NOT_SUPPORTED_RESULT,
        });
    });
});

describe('Workday ATS data transforms', () => {
    it('preprocesses raw candidate with descriptor', () => {
        const rawCandidate = {
            id: 'cand-1',
            descriptor: 'Jane Doe',
            primaryEmail: 'jane.doe@workday.com',
            primaryPhone: '+1-555-0199',
            createdMoment: '2024-01-15T08:00:00Z',
        };

        const preprocessed: any = preprocessUnifyObject({
            obj: rawCandidate,
            tpId: TP_ID.workday as any,
            objType: AtsStandardObjects.candidate,
        });

        expect(preprocessed.firstName).toBe('Jane');
        expect(preprocessed.lastName).toBe('Doe');
        expect(preprocessed.emailAddresses).toEqual([{ value: 'jane.doe@workday.com' }]);
        expect(preprocessed.phones).toEqual([{ value: '+1-555-0199' }]);
        expect(preprocessed.createdOn).toBe('2024-01-15T08:00:00Z');
    });

    it('preprocesses raw candidate with explicit name object', () => {
        const rawCandidate = {
            id: 'cand-2',
            name: { firstName: 'Alice', lastName: 'Smith' },
            emailAddresses: [{ value: 'alice@example.com' }],
        };

        const preprocessed: any = preprocessUnifyObject({
            obj: rawCandidate,
            tpId: TP_ID.workday as any,
            objType: AtsStandardObjects.candidate,
        });

        expect(preprocessed.firstName).toBe('Alice');
        expect(preprocessed.lastName).toBe('Smith');
        expect(preprocessed.emailAddresses).toEqual([{ value: 'alice@example.com' }]);
    });

    it('preprocesses raw job posting', () => {
        const rawJob = {
            id: 'job-101',
            descriptor: 'Senior Backend Engineer',
            jobRequisition: { id: 'req-555' },
            jobPostingStatus: { descriptor: 'Open' },
            postedOn: '2024-02-01',
        };

        const preprocessed: any = preprocessUnifyObject({
            obj: rawJob,
            tpId: TP_ID.workday as any,
            objType: AtsStandardObjects.job,
        });

        expect(preprocessed.title).toBe('Senior Backend Engineer');
        expect(preprocessed.jobRequisitionId).toBe('req-555');
        expect(preprocessed.status).toBe('Open');
        expect(preprocessed.postedOn).toBe('2024-02-01');
    });

    it('preprocesses raw job offer', () => {
        const rawOffer = {
            id: 'offer-201',
            jobApplication: { id: 'app-77' },
            jobPosting: { id: 'job-101' },
            candidate: { id: 'cand-1' },
            status: { descriptor: 'Pending' },
            createdOn: '2024-03-01T12:00:00Z',
            sentOn: '2024-03-02T09:00:00Z',
            startDate: '2024-04-01',
        };

        const preprocessed: any = preprocessUnifyObject({
            obj: rawOffer,
            tpId: TP_ID.workday as any,
            objType: AtsStandardObjects.offer,
        });

        expect(preprocessed.jobApplicationId).toBe('app-77');
        expect(preprocessed.jobPostingId).toBe('job-101');
        expect(preprocessed.candidateId).toBe('cand-1');
        expect(preprocessed.status).toBe('Pending');
        expect(preprocessed.startDate).toBe('2024-04-01');
    });

    it('preprocesses raw department/organization', () => {
        const rawDept = {
            id: 'org-301',
            descriptor: 'Engineering',
            parent: { id: 'org-root' },
        };

        const preprocessed: any = preprocessUnifyObject({
            obj: rawDept,
            tpId: TP_ID.workday as any,
            objType: AtsStandardObjects.department,
        });

        expect(preprocessed.descriptor).toBe('Engineering');
        expect(preprocessed.parentId).toBe('org-root');
    });

    it('disunifies unified candidate into Workday shape', async () => {
        const unifiedCandidate = {
            first_name: 'Bob',
            last_name: 'Jones',
            email_addresses: [{ value: 'bob@example.com' }],
            phone_numbers: [{ value: '555-1234' }],
            applications: ['app-1'],
        };

        const disunified: any = await disunifyAtsObject({
            obj: unifiedCandidate,
            tpId: TP_ID.workday as any,
            objType: AtsStandardObjects.candidate,
        });

        expect(disunified.emailAddresses).toEqual([{ value: 'bob@example.com' }]);
        expect(disunified.phones).toEqual([{ value: '555-1234' }]);
        expect(disunified.applications).toEqual(['app-1']);
    });
});
