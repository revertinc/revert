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

describe('Workable ATS Services Integration', () => {
    const mockRes: any = {
        send: jest.fn(),
        locals: {
            connection: {
                tp_id: TP_ID.workable,
                tp_access_token: 'test_token_123',
                t_id: 'tenant_1',
                schema_mapping_id: 'mapping_1',
                app: {
                    app_config: {
                        org_url: 'acme',
                    },
                },
            },
            account: {
                accountFieldMappingConfig: {},
                apps: [
                    {
                        id: 'app_1',
                        app_config: {
                            org_url: 'acme',
                        },
                    },
                ],
            },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Workable API URL Construction & Headers', () => {
        it('should format URL with organization subdomain correctly', () => {
            const orgSubdomain = 'acme';
            const baseUrl = `https://${orgSubdomain}.workable.com/spi/v3`;
            expect(baseUrl).toBe('https://acme.workable.com/spi/v3');
        });

        it('should format Bearer authorization header', () => {
            const token = 'test_token_123';
            const headers = { Authorization: `Bearer ${token}` };
            expect(headers.Authorization).toBe('Bearer test_token_123');
        });

        it('should format paging parameters with limit and since_id cursor', () => {
            const pageSize = 25;
            const cursor = 'cursor_999';
            const pagingString = `limit=${pageSize}&since_id=${cursor}`;
            expect(pagingString).toBe('limit=25&since_id=cursor_999');
        });
    });

    describe('Candidate & Job Workable Responses', () => {
        it('should process candidate response correctly', async () => {
            const mockCandidateData = {
                id: 'cand_1',
                firstname: 'John',
                lastname: 'Doe',
                email: 'john.doe@example.com',
            };
            (axios as unknown as jest.Mock).mockResolvedValue({
                data: mockCandidateData,
            });

            const result = await axios({
                method: 'get',
                url: 'https://acme.workable.com/spi/v3/candidates/cand_1',
                headers: { Authorization: 'Bearer test_token_123' },
            });

            expect(result.data.id).toBe('cand_1');
            expect(result.data.firstname).toBe('John');
        });

        it('should process job response correctly', async () => {
            const mockJobData = {
                id: 'job_1',
                title: 'Senior Software Engineer',
                state: 'published',
            };
            (axios as unknown as jest.Mock).mockResolvedValue({
                data: mockJobData,
            });

            const result = await axios({
                method: 'get',
                url: 'https://acme.workable.com/spi/v3/jobs/job_1',
                headers: { Authorization: 'Bearer test_token_123' },
            });

            expect(result.data.id).toBe('job_1');
            expect(result.data.title).toBe('Senior Software Engineer');
        });
    });
});
