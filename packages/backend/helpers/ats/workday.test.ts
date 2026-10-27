import { TP_ID } from '@prisma/client';
import { AtsStandardObjects } from '../../constants/common';
import { preprocessUnifyObject } from '../crm/transform/preprocess';
import {
    parseWorkdayTenantUrl,
    resolveWorkdayEndpoints,
    workdayCollection,
    workdayListParams,
    workdayNextCursor,
    workdayProxyUrl,
    workdayResourceUrl,
} from './workday';

describe('Workday ATS helpers', () => {
    const connection = {
        app_config: { org_url: 'https://wd2.example.workday.com/ccx/api/recruiting/v1/acme' },
    };

    test('derives recruiting, staffing and OAuth endpoints from a tenant URL', () => {
        const urls = parseWorkdayTenantUrl('https://wd2.example.workday.com/ccx/api/recruiting/v1/acme/');
        expect(urls.tenant).toBe('acme');
        expect(urls.staffingBase).toBe('https://wd2.example.workday.com/ccx/api/staffing/v1/acme');
        expect(urls.tokenUrl).toBe('https://wd2.example.workday.com/ccx/oauth2/acme/token');
        expect(urls.authorizeUrl).toBe('https://wd2.example.workday.com/ccx/oauth2/acme/authorize');
    });

    test('supports a host plus tenant shape', () => {
        const urls = parseWorkdayTenantUrl('https://services.workday.com/acme');
        expect(urls.recruitingBase).toBe('https://services.workday.com/ccx/api/recruiting/v1/acme');
    });

    test('uses env tenant when organisation URL is host-only', () => {
        const urls = resolveWorkdayEndpoints(
            { app_config: { org_url: 'https://wd2.example.workday.com' } },
            { tenant: 'acme' },
        );
        expect(urls.tenant).toBe('acme');
    });

    test('builds resource URLs without losing query parameters', () => {
        const query = workdayListParams(25, '50', { status: 'Open' });
        const url = workdayResourceUrl(connection, 'candidates', undefined, query);
        expect(url).toContain('/candidates?');
        expect(url).toContain('limit=25');
        expect(url).toContain('offset=50');
        expect(url).toContain('status=Open');
    });

    test('rejects malformed pagination cursors', () => {
        expect(() => workdayListParams(20, '-1')).toThrow('Invalid Workday cursor');
        expect(() => workdayListParams(20, 'nope')).toThrow('Invalid Workday cursor');
    });

    test('normalizes common collection envelopes', () => {
        expect(workdayCollection({ data: [{ id: 1 }], total: 2 })).toEqual({ items: [{ id: 1 }], total: 2 });
        expect(workdayCollection({ results: [{ id: 2 }] })).toEqual({ items: [{ id: 2 }], total: undefined });
    });

    test('calculates next offset cursor', () => {
        expect(workdayNextCursor(0, 20, 45, 20)).toBe('20');
        expect(workdayNextCursor(40, 5, 45, 20)).toBeUndefined();
    });

    test('allows relative proxy paths on the configured tenant', () => {
        expect(workdayProxyUrl(connection, 'workers')).toBe(
            'https://wd2.example.workday.com/ccx/api/recruiting/v1/acme/workers',
        );
    });

    test('treats a leading slash as tenant-relative instead of escaping to the host root', () => {
        expect(workdayProxyUrl(connection, '/workers')).toBe(
            'https://wd2.example.workday.com/ccx/api/recruiting/v1/acme/workers',
        );
    });

    test('blocks absolute URLs on another origin to prevent bearer-token exfiltration', () => {
        expect(() => workdayProxyUrl(connection, 'https://attacker.example/collect')).toThrow(
            'configured tenant origin',
        );
    });

    test('blocks same-origin paths outside the configured tenant API', () => {
        expect(() => workdayProxyUrl(connection, 'https://wd2.example.workday.com/not-workday')).toThrow(
            'configured tenant API',
        );
    });

    test('blocks same-origin OAuth endpoints so bearer tokens cannot be forwarded there', () => {
        expect(() => workdayProxyUrl(connection, 'https://wd2.example.workday.com/ccx/oauth2/acme/token')).toThrow(
            'configured tenant API',
        );
    });

    test('blocks another tenant on the same Workday origin', () => {
        expect(() =>
            workdayProxyUrl(connection, 'https://wd2.example.workday.com/ccx/api/recruiting/v1/other/candidates'),
        ).toThrow('configured tenant API');
    });

    test('allows the configured tenant staffing API as well as recruiting', () => {
        expect(
            workdayProxyUrl(connection, 'https://wd2.example.workday.com/ccx/api/staffing/v1/acme/organizations'),
        ).toBe('https://wd2.example.workday.com/ccx/api/staffing/v1/acme/organizations');
    });
});

describe('Workday ATS normalization', () => {
    test('normalizes candidate names, email and phone shapes', () => {
        const result = preprocessUnifyObject({
            obj: {
                id: 'c1',
                descriptor: 'Ada Lovelace',
                primaryEmail: 'ada@example.com',
                primaryPhone: '+15550001',
            },
            tpId: TP_ID.workday,
            objType: AtsStandardObjects.candidate,
        });
        expect(result.firstName).toBe('Ada');
        expect(result.lastName).toBe('Lovelace');
        expect(result.emailAddresses).toEqual([{ value: 'ada@example.com' }]);
        expect(result.phones).toEqual([{ value: '+15550001' }]);
    });

    test('normalizes nested Workday job and offer references', () => {
        const job = preprocessUnifyObject({
            obj: {
                descriptor: 'Staff Engineer',
                jobRequisition: { id: 'req-9' },
                jobPostingStatus: { descriptor: 'Open' },
            },
            tpId: TP_ID.workday,
            objType: AtsStandardObjects.job,
        });
        expect(job.title).toBe('Staff Engineer');
        expect(job.jobRequisitionId).toBe('req-9');
        expect(job.status).toBe('Open');

        const offer = preprocessUnifyObject({
            obj: {
                jobApplication: { id: 'app-1' },
                jobPosting: { id: 'job-1' },
                candidate: { id: 'candidate-1' },
                status: { descriptor: 'Accepted' },
            },
            tpId: TP_ID.workday,
            objType: AtsStandardObjects.offer,
        });
        expect(offer.jobApplicationId).toBe('app-1');
        expect(offer.jobPostingId).toBe('job-1');
        expect(offer.candidateId).toBe('candidate-1');
        expect(offer.status).toBe('Accepted');
    });
});
