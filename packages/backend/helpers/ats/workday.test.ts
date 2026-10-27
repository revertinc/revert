import { describe, expect, it } from '@jest/globals';
import {
    WorkdayConfigError,
    buildWorkdayListParams,
    extractWorkdayList,
    getWorkdayOAuthUrls,
    getWorkdayServiceUrl,
    hasNextWorkdayPage,
    parseWorkdayTenantUrl,
    unwrapWorkdayEntity,
    WORKDAY_PAGE_SIZE,
} from './workday';

describe('parseWorkdayTenantUrl', () => {
    it('parses a full REST tenant URL', () => {
        const tenant = parseWorkdayTenantUrl('https://wd2-impl-services1.workday.com/ccx/api/v1/acme');
        expect(tenant).toEqual({
            host: 'wd2-impl-services1.workday.com',
            tenant: 'acme',
            baseUrl: 'https://wd2-impl-services1.workday.com/ccx/api/v1/acme',
        });
    });

    it('accepts a bare host when the tenant comes from app_config', () => {
        const tenant = parseWorkdayTenantUrl('https://wd5-impl-services1.workday.com', 'globex');
        expect(tenant.tenant).toBe('globex');
        expect(tenant.baseUrl).toBe('https://wd5-impl-services1.workday.com/ccx/api/v1/globex');
    });

    it('rejects non-workday hosts so tokens never leak to arbitrary URLs', () => {
        expect(() => parseWorkdayTenantUrl('https://evil.example.com/ccx/api/v1/acme')).toThrow(WorkdayConfigError);
        expect(() => parseWorkdayTenantUrl('https://workday.com.evil.com/ccx/api/v1/acme')).toThrow(WorkdayConfigError);
    });

    it('rejects http, missing URLs and bad tenant names', () => {
        expect(() => parseWorkdayTenantUrl('http://wd2-impl-services1.workday.com/ccx/api/v1/acme')).toThrow(
            WorkdayConfigError,
        );
        expect(() => parseWorkdayTenantUrl(undefined)).toThrow(WorkdayConfigError);
        expect(() => parseWorkdayTenantUrl('https://wd2-impl-services1.workday.com/ccx/api/v1/ac me')).toThrow(
            WorkdayConfigError,
        );
    });
});

describe('getWorkdayOAuthUrls', () => {
    it('derives authorize and token endpoints from the tenant', () => {
        const tenant = parseWorkdayTenantUrl('https://wd2-impl-services1.workday.com/ccx/api/v1/acme');
        expect(getWorkdayOAuthUrls(tenant)).toEqual({
            authorizeUrl: 'https://wd2-impl-services1.workday.com/ccx/oauth2/acme/authorize',
            tokenUrl: 'https://wd2-impl-services1.workday.com/ccx/oauth2/acme/token',
        });
    });
});

describe('getWorkdayServiceUrl', () => {
    it('builds recruiting and staffing service URLs', () => {
        const tenant = parseWorkdayTenantUrl('https://wd2-impl-services1.workday.com/ccx/api/v1/acme');
        expect(getWorkdayServiceUrl(tenant, 'recruiting')).toBe(
            'https://wd2-impl-services1.workday.com/ccx/api/v1/acme/recruiting/v1',
        );
        expect(getWorkdayServiceUrl(tenant, 'staffing')).toBe(
            'https://wd2-impl-services1.workday.com/ccx/api/v1/acme/staffing/v1',
        );
    });
});

describe('pagination', () => {
    it('builds limit/offset params per page', () => {
        expect(buildWorkdayListParams(1)).toEqual({ limit: WORKDAY_PAGE_SIZE, offset: 0 });
        expect(buildWorkdayListParams(3)).toEqual({ limit: WORKDAY_PAGE_SIZE, offset: 200 });
        expect(buildWorkdayListParams(0)).toEqual({ limit: WORKDAY_PAGE_SIZE, offset: 0 });
    });

    it('detects the next page from total, falling back to page size', () => {
        expect(hasNextWorkdayPage(new Array(100), 250, 1)).toBe(true);
        expect(hasNextWorkdayPage(new Array(50), 250, 3)).toBe(false);
        expect(hasNextWorkdayPage(new Array(100), undefined, 1)).toBe(true);
        expect(hasNextWorkdayPage(new Array(42), undefined, 1)).toBe(false);
    });

    it('extracts data and total from a list response', () => {
        expect(extractWorkdayList({ data: [{ id: '1' }], total: 1 })).toEqual({ data: [{ id: '1' }], total: 1 });
        expect(extractWorkdayList({})).toEqual({ data: [], total: undefined });
        expect(extractWorkdayList(undefined)).toEqual({ data: [], total: undefined });
    });
});

describe('unwrapWorkdayEntity', () => {
    it('lifts the entity data bag onto the top level', () => {
        const candidate = {
            id: 'c1',
            descriptor: 'John Doe',
            candidateData: { nameData: { legalNameData: { firstName: 'John', lastName: 'Doe' } } },
        };
        const unwrapped: any = unwrapWorkdayEntity(candidate, 'candidateData');
        expect(unwrapped.candidateData).toBeUndefined();
        expect(unwrapped.id).toBe('c1');
        expect(unwrapped.nameData).toEqual({ legalNameData: { firstName: 'John', lastName: 'Doe' } });
    });

    it('is a no-op when the data key is missing', () => {
        const candidate = { id: 'c1' };
        expect(unwrapWorkdayEntity(candidate, 'candidateData')).toEqual(candidate);
    });
});
