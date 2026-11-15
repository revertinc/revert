import workable from './workable';
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

describe('Workable ATS Integration', () => {
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
                        org_url: 'testcompany',
                    },
                },
            ],
        },
        code: 'workable_api_token_xyz',
        integrationId: TP_ID.workable,
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
        it('should map TP_ID.workable to Workable', () => {
            expect(mapIntegrationIdToIntegrationName[TP_ID.workable]).toBe('Workable');
        });

        it('should define default scopes for Workable', () => {
            expect(DEFAULT_SCOPE[TP_ID.workable]).toContain('r_jobs');
            expect(DEFAULT_SCOPE[TP_ID.workable]).toContain('r_candidates');
            expect(DEFAULT_SCOPE[TP_ID.workable]).toContain('w_candidates');
        });
    });

    describe('handleOAuth - Direct API Token Flow', () => {
        it('should successfully store connection and emit webhook when API token is provided', async () => {
            (xprisma.connections.upsert as jest.Mock).mockResolvedValue({ id: 'tenant_test_1' });
            (sendConnectionAddedEvent as jest.Mock).mockResolvedValue(true);

            const result = await workable.handleOAuth(baseAuthProps);

            expect(xprisma.connections.upsert).toHaveBeenCalledWith({
                where: { id: 'tenant_test_1' },
                create: expect.objectContaining({
                    id: 'tenant_test_1',
                    tp_id: TP_ID.workable,
                    tp_access_token: 'workable_api_token_xyz',
                    tp_customer_id: 'Workable user',
                    owner_account_public_token: 'pub_test_key',
                }),
                update: expect.objectContaining({
                    tp_id: TP_ID.workable,
                    tp_access_token: 'workable_api_token_xyz',
                    tp_customer_id: 'Workable user',
                }),
            });

            expect(sendConnectionAddedEvent).toHaveBeenCalledWith(
                'svix_123',
                'tenant_test_1',
                TP_ID.workable,
                'workable_api_token_xyz',
                'Workable user',
            );

            expect(result).toMatchObject({
                status: true,
                tenantId: 'tenant_test_1',
                integrationName: 'Workable',
                tpCustomerId: 'Workable user',
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

            const result = await workable.handleOAuth(oauthProps);

            expect(axios).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'post',
                    url: 'https://testcompany.workable.com/oauth/token',
                    data: expect.objectContaining({
                        client_id: 'client_id_abc',
                        client_secret: 'client_secret_xyz',
                        code: 'auth_code_789',
                        grant_type: 'authorization_code',
                    }),
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
                TP_ID.workable,
                'exchanged_access_token_123',
                'Workable user',
            );

            expect(result).toMatchObject({
                status: true,
                tenantId: 'tenant_test_1',
                integrationName: 'Workable',
            });
        });
    });

    describe('handleBasicAuth', () => {
        it('should delegate to handleOAuth cleanly', async () => {
            (xprisma.connections.upsert as jest.Mock).mockResolvedValue({ id: 'tenant_test_1' });
            const result = await workable.handleBasicAuth(baseAuthProps);
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

            const result = await workable.handleOAuth(baseAuthProps);

            expect(result).toMatchObject({
                status: false,
                error: dbError,
                tenantId: 'tenant_test_1',
                integrationName: 'Workable',
            });
        });
    });
});
