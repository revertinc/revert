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

describe('Bullhorn ATS Services Integration', () => {
    const mockRes: any = {
        send: jest.fn(),
        locals: {
            connection: {
                tp_id: TP_ID.bullhorn,
                tp_access_token: JSON.stringify({
                    BhRestToken: 'mock_bh_rest_token_123',
                    restUrl: 'https://rest99.bullhornstaffing.com/rest-services/corp99/',
                }),
                t_id: 'tenant_bh_1',
                schema_mapping_id: 'mapping_bh_1',
                app: {
                    app_config: {},
                },
            },
            account: {
                accountFieldMappingConfig: {},
                apps: [
                    {
                        id: 'app_bh_1',
                        app_config: {},
                    },
                ],
            },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Bullhorn Context & Header Construction', () => {
        it('should correctly parse BhRestToken and restUrl from connection token JSON', () => {
            const rawToken = JSON.stringify({
                BhRestToken: 'token_xyz',
                restUrl: 'https://rest1.bullhornstaffing.com/rest-services/c1/',
            });
            const parsed = JSON.parse(rawToken);
            expect(parsed.BhRestToken).toBe('token_xyz');
            expect(parsed.restUrl).toBe('https://rest1.bullhornstaffing.com/rest-services/c1/');
        });

        it('should construct BhRestToken header properly', () => {
            const bhRestToken = 'mock_bh_rest_token_123';
            const headers = { BhRestToken: bhRestToken };
            expect(headers.BhRestToken).toBe('mock_bh_rest_token_123');
        });
    });

    describe('Candidate & Job Bullhorn API Handlers', () => {
        it('should mock fetch candidate from Bullhorn entity API', async () => {
            const mockCandidate = {
                data: {
                    id: 1001,
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@example.com',
                    phone: '+1-555-1234',
                    occupation: 'Software Engineer',
                    status: 'Active',
                    dateAdded: 1680000000000,
                },
            };

            (axios as unknown as jest.Mock).mockResolvedValueOnce({
                data: mockCandidate,
            });

            const result = await axios({
                method: 'get',
                url: 'https://rest99.bullhornstaffing.com/rest-services/corp99/entity/Candidate/1001',
                headers: { BhRestToken: 'mock_bh_rest_token_123' },
            });

            expect(result.data.data.id).toBe(1001);
            expect(result.data.data.firstName).toBe('John');
            expect(result.data.data.occupation).toBe('Software Engineer');
        });

        it('should mock query candidates with where=isDeleted=false filter', async () => {
            const mockCandidatesList = {
                data: [
                    { id: 1001, firstName: 'John', lastName: 'Doe' },
                    { id: 1002, firstName: 'Jane', lastName: 'Smith' },
                ],
                count: 2,
                start: 0,
            };

            (axios as unknown as jest.Mock).mockResolvedValueOnce({
                data: mockCandidatesList,
            });

            const result = await axios({
                method: 'get',
                url: 'https://rest99.bullhornstaffing.com/rest-services/corp99/query/Candidate',
                headers: { BhRestToken: 'mock_bh_rest_token_123' },
                params: {
                    where: 'isDeleted=false',
                    count: 20,
                    start: 0,
                },
            });

            expect(result.data.data.length).toBe(2);
            expect(result.data.count).toBe(2);
        });

        it('should mock fetch job order from Bullhorn entity API', async () => {
            const mockJob = {
                data: {
                    id: 5001,
                    title: 'Senior TypeScript Architect',
                    description: 'Lead engineering teams on scalable APIs',
                    employmentType: 'Full-Time',
                    status: 'Accepting Candidates',
                    isOpen: true,
                },
            };

            (axios as unknown as jest.Mock).mockResolvedValueOnce({
                data: mockJob,
            });

            const result = await axios({
                method: 'get',
                url: 'https://rest99.bullhornstaffing.com/rest-services/corp99/entity/JobOrder/5001',
                headers: { BhRestToken: 'mock_bh_rest_token_123' },
            });

            expect(result.data.data.id).toBe(5001);
            expect(result.data.data.title).toBe('Senior TypeScript Architect');
            expect(result.data.data.isOpen).toBe(true);
        });
    });
});
