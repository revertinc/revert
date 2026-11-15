import workday from './workday';
import axios from 'axios';
import { xprisma } from '../../../../prisma/client';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import { TP_ID } from '@prisma/client';
import { mapIntegrationIdToIntegrationName, DEFAULT_SCOPE } from '../../../../constants/common';

jest.mock('axios');
jest.mock('../../../../prisma/client', () => ({
    xprisma: {
        connections: {
            upsert: jest.fn(),
        },
    },
}));
jest.mock('../../../../helpers/webhooks/connection');
jest.mock('../../../../helpers/auth/processOAuthResult');
jest.mock('../../../../redis/client', () => ({
    createClient: jest.fn().mockReturnThis(),
    on: jest.fn(),
    connect: jest.fn(),
}));
jest.mock('../../../../helpers/logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
    logDebug: jest.fn(),
    logWarn: jest.fn(),
}));

describe('Workday ATS Integration', () => {
    const mockResponse: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        redirect: jest.fn(),
    };

    const baseAuthProps: any = {
        account: {
            id: 'acc_123',
            apps: [
                {
                    id: 'app_123',
                    app_config: {
                        org_url: 'wd2-impl-services1.workday.com',
                        tenant: 'my_tenant',
                    },
                },
            ],
        },
        code: 'workday_api_token_xyz',
        integrationId: TP_ID.workday,
        revertPublicKey: 'pub_test_key',
        svixAppId: 'svix_123',
        environmentId: 'env_123',
        tenantId: 'tenant_test_1',
        tenantSecretToken: 'sec_test_token',
        response: mockResponse,
        redirectUrl: 'https://example.com/oauth/callback',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (processOAuthResult as jest.Mock).mockImplementation((args) => args);
    });

    describe('Constants & Scopes', () => {
        it('should map TP_ID.workday to Workday', () => {
            expect(mapIntegrationIdToIntegrationName[TP_ID.workday]).toBe('Workday');
        });

        it('should define default scopes for Workday', () => {
            expect(DEFAULT_SCOPE[TP_ID.workday]).toContain('recruiting:read');
            expect(DEFAULT_SCOPE[TP_ID.workday]).toContain('recruiting:write');
            expect(DEFAULT_SCOPE[TP_ID.workday]).toContain('offline_access');
        });
    });

    describe('handleOAuth - Direct API Token Flow', () => {
        it('should successfully store connection and emit webhook when API token is provided', async () => {
            (xprisma.connections.upsert as jest.Mock).mockResolvedValue({ id: 'tenant_test_1' });
            (sendConnectionAddedEvent as jest.Mock).mockResolvedValue(true);

            const result = await workday.handleOAuth(baseAuthProps);

            expect(xprisma.connections.upsert).toHaveBeenCalledWith({
                where: { id: 'tenant_test_1' },
                create: expect.objectContaining({
                    id: 'tenant_test_1',
                    tp_id: TP_ID.workday,
                    tp_access_token: 'workday_api_token_xyz',
                    tp_customer_id: 'Workday user',
                    owner_account_public_token: 'pub_test_key',
                }),
                update: expect.objectContaining({
                    tp_id: TP_ID.workday,
                    tp_access_token: 'workday_api_token_xyz',
                    tp_customer_id: 'Workday user',
                }),
            });

            expect(sendConnectionAddedEvent).toHaveBeenCalledWith(
                'svix_123',
                'tenant_test_1',
                TP_ID.workday,
                'workday_api_token_xyz',
                'Workday user',
            );

            expect(result).toMatchObject({
                status: true,
                tenantId: 'tenant_test_1',
                integrationName: 'Workday',
                tpCustomerId: 'Workday user',
            });
        });
    });

    describe('handleOAuth - OAuth2 Code Exchange Flow', () => {
        it('should exchange code for tokens when clientId and clientSecret are provided', async () => {
            (axios as unknown as jest.Mock).mockResolvedValue({
                data: {
                    access_token: 'exchanged_access_token_123',
                    refresh_token: 'exchanged_refresh_token_456',
                },
            });
            (xprisma.connections.upsert as jest.Mock).mockResolvedValue({ id: 'tenant_test_1' });
            (sendConnectionAddedEvent as jest.Mock).mockResolvedValue(true);

            const oauthProps = {
                ...baseAuthProps,
                clientId: 'client_id_abc',
                clientSecret: 'client_secret_xyz',
                code: 'auth_code_789',
            };

            const result = await workday.handleOAuth(oauthProps);

            expect(axios).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'post',
                    url: 'https://wd2-impl-services1.workday.com/ccx/oauth2/my_tenant/token',
                }),
            );

            expect(xprisma.connections.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    create: expect.objectContaining({
                        tp_access_token: 'exchanged_access_token_123',
                        tp_refresh_token: 'exchanged_refresh_token_456',
                        app_client_id: 'client_id_abc',
                    }),
                }),
            );

            expect(sendConnectionAddedEvent).toHaveBeenCalledWith(
                'svix_123',
                'tenant_test_1',
                TP_ID.workday,
                'exchanged_access_token_123',
                'Workday user',
            );

            expect(result).toMatchObject({
                status: true,
                tenantId: 'tenant_test_1',
                integrationName: 'Workday',
            });
        });
    });

    describe('handleBasicAuth', () => {
        it('should delegate to handleOAuth cleanly', async () => {
            (xprisma.connections.upsert as jest.Mock).mockResolvedValue({ id: 'tenant_test_1' });
            const result = await workday.handleBasicAuth(baseAuthProps);
            expect(result).toMatchObject({
                status: true,
                tenantId: 'tenant_test_1',
            });
        });
    });

    describe('Error handling', () => {
        it('should return failure result when database upsert throws', async () => {
            const dbError = new Error('Database connection failed');
            (xprisma.connections.upsert as jest.Mock).mockRejectedValue(dbError);

            const result = await workday.handleOAuth(baseAuthProps);

            expect(result).toMatchObject({
                status: false,
                error: dbError,
                tenantId: 'tenant_test_1',
                integrationName: 'Workday',
            });
        });
    });
});
