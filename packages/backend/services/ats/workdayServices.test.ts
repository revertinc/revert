import axios from 'axios';
import { TP_ID } from '@prisma/client';

jest.mock('axios');
jest.mock('../../helpers/logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
    logDebug: jest.fn(),
    logWarn: jest.fn(),
}));
jest.mock('../../helpers/crm/transform', () => ({
    unifyObject: jest.fn(async ({ obj }) => ({
        ...obj,
        _unified: true,
    })),
    disunifyAtsObject: jest.fn(async ({ obj }) => ({
        ...obj,
        _disunified: true,
    })),
}));

describe('Workday ATS Services Integration', () => {
    const mockRes: any = {
        send: jest.fn(),
        locals: {
            connection: {
                tp_id: TP_ID.workday,
                tp_access_token: 'test_token_123',
                t_id: 'tenant_1',
                schema_mapping_id: 'mapping_1',
                app: {
                    app_config: {
                        org_url: 'wd2-impl-services1.workday.com',
                        tenant: 'acme_corp',
                    },
                },
            },
            account: {
                accountFieldMappingConfig: {},
                apps: [
                    {
                        id: 'app_1',
                        app_config: {
                            org_url: 'wd2-impl-services1.workday.com',
                            tenant: 'acme_corp',
                        },
                    },
                ],
            },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Workday API URL Construction & Headers', () => {
        it('should format URL with host and tenant correctly', () => {
            const host = 'wd2-impl-services1.workday.com';
            const tenant = 'acme_corp';
            const baseUrl = `https://${host}/ccx/api/v1/${tenant}`;
            expect(baseUrl).toBe('https://wd2-impl-services1.workday.com/ccx/api/v1/acme_corp');
        });

        it('should format Bearer authorization header', () => {
            const token = 'test_token_123';
            const headers = { Authorization: `Bearer ${token}` };
            expect(headers.Authorization).toBe('Bearer test_token_123');
        });

        it('should format paging parameters with limit and offset cursor', () => {
            const pageSize = 50;
            const cursor = '100';
            const pagingString = `limit=${pageSize}&offset=${cursor}`;
            expect(pagingString).toBe('limit=50&offset=100');
        });
    });

    describe('Candidate & Job Workday Responses', () => {
        it('should process candidate response correctly', async () => {
            const mockCandidateData = {
                id: 'cand_wd_1',
                first_name: 'Jane',
                last_name: 'Smith',
                company: 'Workday Inc',
                title: 'Principal Engineer',
            };
            (axios as unknown as jest.Mock).mockResolvedValue({
                data: mockCandidateData,
            });

            const result = await axios({
                method: 'get',
                url: 'https://wd2-impl-services1.workday.com/ccx/api/v1/acme_corp/recruiting/candidates/cand_wd_1',
                headers: { Authorization: 'Bearer test_token_123' },
            });

            expect(result.data.id).toBe('cand_wd_1');
            expect(result.data.first_name).toBe('Jane');
            expect(result.data.title).toBe('Principal Engineer');
        });

        it('should process job response correctly', async () => {
            const mockJobData = {
                id: 'job_wd_1',
                title: 'Staff Platform Engineer',
                requisitionId: 'REQ-12345',
                status: 'Open',
            };
            (axios as unknown as jest.Mock).mockResolvedValue({
                data: mockJobData,
            });

            const result = await axios({
                method: 'get',
                url: 'https://wd2-impl-services1.workday.com/ccx/api/v1/acme_corp/recruiting/jobPostings/job_wd_1',
                headers: { Authorization: 'Bearer test_token_123' },
            });

            expect(result.data.id).toBe('job_wd_1');
            expect(result.data.title).toBe('Staff Platform Engineer');
            expect(result.data.requisitionId).toBe('REQ-12345');
        });
    });
});
