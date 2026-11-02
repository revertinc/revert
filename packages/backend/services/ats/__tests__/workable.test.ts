import axios from 'axios';
import workableOAuthHandler from '../../../routes/v1/ats/authHandlers/workable';
import { xprisma } from '../../../prisma/client';
import { AtsStandardObjects } from '../../../constants/common';
import { preprocessUnifyObject, postprocessDisUnifyAtsObject } from '../../../helpers/crm/transform/preprocess';
import { disunifyAtsObject } from '../../../helpers/crm/transform/disunify';
import { TP_ID } from '@prisma/client';

jest.mock('axios');
jest.mock('../../../prisma/client', () => ({
    xprisma: {
        apps: {
            findFirst: jest.fn(),
        },
        connections: {
            upsert: jest.fn(),
        },
    },
}));
jest.mock('../../../helpers/webhooks/connection', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('../../../helpers/auth/processOAuthResult', () => ({
    __esModule: true,
    default: jest.fn((args) => args),
}));
jest.mock('../../../helpers/crm/transform', () => ({
    transformModelToFieldMapping: jest.fn().mockImplementation(async ({ unifiedObj }) => unifiedObj),
}));

const mockedAxios = axios as unknown as jest.Mocked<typeof axios> & jest.Mock;

describe('Workable ATS Integration (#551)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('preprocesses Workable candidate firstname/lastname/email into unified fields', () => {
        const raw = {
            id: 'wk-cand-1',
            firstname: 'Linus',
            lastname: 'Torvalds',
            email: 'linus@kernel.org',
            created_at: '2026-11-01T10:00:00Z',
        };
        const processed = preprocessUnifyObject({
            obj: raw,
            tpId: TP_ID.workable,
            objType: AtsStandardObjects.candidate,
        });
        expect(processed.firstName).toBe('Linus');
        expect(processed.lastName).toBe('Torvalds');
        expect(processed.name).toBe('Linus Torvalds');
        expect(processed.emails).toEqual([{ value: 'linus@kernel.org', type: undefined }]);
    });

    it('preprocesses Workable job and department objects', () => {
        const rawJob = {
            id: 'wk-job-1',
            title: 'Principal Systems Engineer',
            state: 'published',
        };
        const processedJob = preprocessUnifyObject({
            obj: rawJob,
            tpId: TP_ID.workable,
            objType: AtsStandardObjects.job,
        });
        expect(processedJob.text).toBe('Principal Systems Engineer');
        expect(processedJob.state).toBe('open');

        const rawDept = {
            id: 'wk-dept-1',
            department: 'Infrastructure',
        };
        const processedDept = preprocessUnifyObject({
            obj: rawDept,
            tpId: TP_ID.workable,
            objType: AtsStandardObjects.department,
        });
        expect(processedDept.name).toBe('Infrastructure');
    });

    it('disunifies unified candidate object into Workable candidate payload', async () => {
        const disunified = await disunifyAtsObject({
            obj: {
                first_name: 'Margaret',
                last_name: 'Hamilton',
                email_addresses: [{ value: 'margaret@apollo.org' }],
            },
            tpId: TP_ID.workable,
            objType: AtsStandardObjects.candidate,
        });
        expect(disunified.firstname).toBe('Margaret');
        expect(disunified.lastname).toBe('Hamilton');
        expect(disunified.name).toBe('Margaret Hamilton');
        expect(disunified.email).toBe('margaret@apollo.org');
    });

    it('supports postprocessDisUnifyAtsObject for Workable', () => {
        const obj = { id: 'wk-123' };
        const res = postprocessDisUnifyAtsObject({
            obj,
            tpId: TP_ID.workable,
            objType: AtsStandardObjects.candidate,
        });
        expect(res).toEqual(obj);
    });

    it('exchanges Workable OAuth2 authorization code and upserts connection', async () => {
        mockedAxios.mockResolvedValueOnce({
            data: {
                access_token: 'new-wk-access',
                refresh_token: 'new-wk-refresh',
            },
        } as any);

        const result: any = await workableOAuthHandler.handleOAuth({
            account: {
                apps: [
                    {
                        id: 'app-wk',
                        app_config: { org_url: 'https://acme.workable.com' },
                    },
                ],
            },
            clientId: 'wk-client',
            clientSecret: 'wk-secret',
            code: 'auth-code-wk',
            integrationId: 'workable',
            revertPublicKey: 'pk-1',
            svixAppId: 'svix-1',
            environmentId: 'env-1',
            tenantId: 't-88',
            tenantSecretToken: 'sec-1',
            response: {} as any,
        } as any);

        expect(mockedAxios).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'post',
                url: 'https://acme.workable.com/oauth/token',
            })
        );
        expect(xprisma.connections.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 't-88' },
                create: expect.objectContaining({
                    tp_id: 'workable',
                    tp_access_token: 'new-wk-access',
                    tp_refresh_token: 'new-wk-refresh',
                    tp_account_url: 'https://acme.workable.com',
                }),
            })
        );
        expect(result.status).toBe(true);
    });
});
