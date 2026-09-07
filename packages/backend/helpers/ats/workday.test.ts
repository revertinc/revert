import { describe, expect, it } from '@jest/globals';

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
    });

    it('parses a full recruiting REST base and derives OAuth URLs', () => {
        const parsed = parseWorkdayOrgUrl('https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme_tenant/');
        expect(parsed.origin).toBe('https://wd2-impl-services1.workday.com');
        expect(parsed.tenant).toBe('acme_tenant');
        expect(parsed.recruitingBase).toBe('https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme_tenant');
        expect(parsed.staffingBase).toBe('https://wd2-impl-services1.workday.com/ccx/api/staffing/v1/acme_tenant');
        expect(parsed.tokenUrl).toBe('https://wd2-impl-services1.workday.com/ccx/oauth2/acme_tenant/token');
        expect(parsed.authorizeUrl).toBe('https://wd2-impl-services1.workday.com/acme_tenant/authorize');
    });

    it('parses host + tenant and builds recruiting v1 as the ATS REST root', () => {
        const parsed = parseWorkdayOrgUrl('https://impl.workday.com/northstar');
        expect(parsed.tenant).toBe('northstar');
        expect(parsed.recruitingBase).toBe('https://impl.workday.com/ccx/api/recruiting/v1/northstar');
        expect(parsed.tokenUrl).toBe('https://impl.workday.com/ccx/oauth2/northstar/token');
    });

    it('keeps staffing URLs on the staffing service while mapping recruiting resources separately', () => {
        const parsed = parseWorkdayOrgUrl('https://wd2-impl-services1.workday.com/ccx/api/staffing/v2/acme');
        expect(parsed.tenant).toBe('acme');
        expect(parsed.recruitingBase).toBe('https://wd2-impl-services1.workday.com/ccx/api/recruiting/v2/acme');
        expect(parsed.staffingBase).toBe('https://wd2-impl-services1.workday.com/ccx/api/staffing/v2/acme');
    });

    it('honors explicit token and authorize URL overrides', () => {
        const parsed = parseWorkdayOrgUrl('https://impl.workday.com/acme', {
            tokenUrl: 'https://custom.example/token/',
            authUrl: 'https://custom.example/authorize/',
        });
        expect(parsed.tokenUrl).toBe('https://custom.example/token');
        expect(parsed.authorizeUrl).toBe('https://custom.example/authorize');
    });

    it('resolves org URL with connection.tp_account_url over app_config and env', () => {
        const resolved = resolveWorkdayOrgUrl(
            {
                tp_account_url: 'https://impl.workday.com/ccx/api/recruiting/v1/from-connection/',
                app_config: { org_url: 'https://impl.workday.com/from-connection-config' },
                app: { app_config: { org_url: 'https://impl.workday.com/from-app' } },
            },
            'https://impl.workday.com/from-env',
        );
        expect(resolved).toBe('https://impl.workday.com/ccx/api/recruiting/v1/from-connection');
    });

    it('falls back from app_config.org_url to env WORKDAY_API_BASE_URL', () => {
        const resolved = resolveWorkdayOrgUrl(
            {
                tp_account_url: null,
                app: { app_config: { org_url: 'https://impl.workday.com/from-app/' } },
            },
            'https://impl.workday.com/from-env',
        );
        expect(resolved).toBe('https://impl.workday.com/from-app');
    });

    it('reports when a tenant URL is missing', () => {
        expect(hasWorkdayTenantUrl({ tp_account_url: null, app: { app_config: {} } })).toBe(false);
        expect(hasWorkdayTenantUrl({ tp_account_url: 'https://impl.workday.com/acme' })).toBe(true);
        expect(missingWorkdayTenantMessage()).toContain('org_url');
    });
});

describe('Workday auth header and routing', () => {
    it('builds a Bearer Authorization header', () => {
        expect(getWorkdayAuthHeaders('wd-token-123')).toEqual({
            Authorization: 'Bearer wd-token-123',
            Accept: 'application/json',
            'Content-Type': 'application/json',
        });
    });

    it('joins resource paths without duplicate slashes', () => {
        expect(joinWorkdayUrl('https://impl.workday.com/ccx/api/recruiting/v1/acme/', '/candidates/', 'abc')).toBe(
            'https://impl.workday.com/ccx/api/recruiting/v1/acme/candidates/abc',
        );
    });

    it('routes candidate/job/offer calls to recruiting and departments to staffing', () => {
        const connection = {
            tp_account_url: 'https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme',
        };
        expect(resolveWorkdayResourceUrl(connection, 'candidates', 'cand_1')).toBe(
            'https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme/candidates/cand_1',
        );
        expect(resolveWorkdayResourceUrl(connection, 'jobPostings')).toBe(
            'https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme/jobPostings',
        );
        expect(resolveWorkdayResourceUrl(connection, 'jobOffers', undefined, 'limit=10')).toBe(
            'https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme/jobOffers?limit=10',
        );
        expect(resolveWorkdayResourceUrl(connection, 'organizations', 'org_1')).toBe(
            'https://wd2-impl-services1.workday.com/ccx/api/staffing/v1/acme/organizations/org_1',
        );
        expect(resolveWorkdayProxyUrl(connection, '/jobApplications?limit=1')).toBe(
            'https://wd2-impl-services1.workday.com/ccx/api/recruiting/v1/acme/jobApplications?limit=1',
        );
        expect(resolveWorkdayProxyUrl(connection, 'https://impl.workday.com/custom/path')).toBe(
            'https://impl.workday.com/custom/path',
        );
    });
});

describe('Workday pagination and collection parsing', () => {
    it('builds offset/limit query strings like other ATS list routes', () => {
        expect(workdayListPaging(25, '50')).toEqual({ pagingString: 'limit=25&offset=50', offset: 50, limit: 25 });
        expect(workdayListPaging(undefined, undefined).pagingString).toBe('');
    });

    it('computes the next cursor from total when present', () => {
        expect(nextWorkdayCursor(0, 20, 55, 20)).toBe('20');
        expect(nextWorkdayCursor(40, 15, 55, 20)).toBeUndefined();
    });

    it('extracts Workday collection and single-resource payloads', () => {
        expect(extractWorkdayCollection({ total: 2, data: [{ id: 'a' }, { id: 'b' }] })).toEqual({
            items: [{ id: 'a' }, { id: 'b' }],
            total: 2,
        });
        expect(extractWorkdayResource({ data: { id: 'cand_1' } })).toEqual({ id: 'cand_1' });
        expect(extractWorkdayResource({ id: 'cand_1' })).toEqual({ id: 'cand_1' });
    });

    it('appends extra field query params without a leading ?', () => {
        expect(appendQueryParams('limit=10', { include: 'applications' })).toBe('limit=10&include=applications');
    });
});

describe('Workday unsupported operations', () => {
    it('returns the same not-supported body shape used by Lever/Greenhouse', () => {
        expect(workdayNotSupportedBody('message')).toEqual({
            status: 'ok',
            message: WORKDAY_NOT_SUPPORTED_MESSAGE,
        });
        expect(workdayNotSupportedBody('result')).toEqual({
            status: 'ok',
            result: WORKDAY_NOT_SUPPORTED_RESULT,
        });
        expect(WORKDAY_NOT_SUPPORTED_MESSAGE).toBe('This endpoint is currently not supported');
        expect(WORKDAY_NOT_SUPPORTED_RESULT).toBe('This endpoint is currently not supported.');
    });
});
