import axios from 'axios';
import workdayOAuthHandler from '../../../routes/v1/ats/authHandlers/workday';
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

describe('Workday ATS Integration (#372)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('preprocesses Workday candidate descriptor into firstName, lastName, and name', () => {
        const raw = {
            id: 'cand-1',
            descriptor: 'Ada Lovelace',
        };
        const processed = preprocessUnifyObject({
            obj: raw,
            tpId: TP_ID.workday,
            objType: AtsStandardObjects.candidate,
        });
        expect(processed.firstName).toBe('Ada');
        expect(processed.lastName).toBe('Lovelace');
        expect(processed.name).toBe('Ada Lovelace');
    });

    it('preprocesses Workday job and department objects', () => {
        const rawJob = {
            id: 'job-1',
            jobPostingTitle: 'Staff Backend Engineer',
        };
        const processedJob = preprocessUnifyObject({
            obj: rawJob,
            tpId: TP_ID.workday,
            objType: AtsStandardObjects.job,
        });
        expect(processedJob.text).toBe('Staff Backend Engineer');

        const rawDept = {
            id: 'dept-1',
            descriptor: 'Core Platform Engineering',
        };
        const processedDept = preprocessUnifyObject({
            obj: rawDept,
            tpId: TP_ID.workday,
            objType: AtsStandardObjects.department,
        });
        expect(processedDept.name).toBe('Core Platform Engineering');
    });

    it('disunifies unified candidate object into Workday givenName and familyName payload', async () => {
        const disunified = await disunifyAtsObject({
            obj: {
                first_name: 'Grace',
                last_name: 'Hopper',
            },
            tpId: TP_ID.workday,
            objType: AtsStandardObjects.candidate,
        });
        expect(disunified.name).toEqual({
            givenName: 'Grace',
            familyName: 'Hopper',
        });
    });

    it('supports postprocessDisUnifyAtsObject for Workday', () => {
        const obj = { id: 'wd-123' };
        const res = postprocessDisUnifyAtsObject({
            obj,
            tpId: TP_ID.workday,
            objType: AtsStandardObjects.candidate,
        });
        expect(res).toEqual(obj);
    });

    it('exchanges Workday OAuth2 authorization code and upserts connection', async () => {
        mockedAxios.mockResolvedValueOnce({
            data: {
                access_token: 'new-wd-access',
                refresh_token: 'new-wd-refresh',
            },
        } as any);

        const result: any = await workdayOAuthHandler.handleOAuth({
            account: {
                apps: [
                    {
                        id: 'app-wd',
                        app_config: { org_url: 'https://wd2-impl-services1.workday.com' },
                    },
                ],
            },
            clientId: 'wd-client',
            clientSecret: 'wd-secret',
            code: 'auth-code-xyz',
            integrationId: 'workday',
            revertPublicKey: 'pk-1',
            svixAppId: 'svix-1',
            environmentId: 'env-1',
            tenantId: 't-99',
            tenantSecretToken: 'sec-1',
            response: {} as any,
        } as any);

        expect(mockedAxios).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'post',
                url: 'https://wd2-impl-services1.workday.com/ccx/oauth2/token',
            })
        );
        expect(xprisma.connections.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 't-99' },
                create: expect.objectContaining({
                    tp_id: 'workday',
                    tp_access_token: 'new-wd-access',
                    tp_refresh_token: 'new-wd-refresh',
                    tp_account_url: 'https://wd2-impl-services1.workday.com',
                }),
            })
        );
        expect(result.status).toBe(true);
    });
});
