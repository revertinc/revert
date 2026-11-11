import bullhorn from './bullhorn';
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

describe('Bullhorn ATS Integration', () => {
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
                    app_client_id: 'test_client_id',
                    app_client_secret: 'test_client_secret',
                    is_revert_app: false,
                    app_config: {},
                },
            ],
            accounts: [],
        },
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
        code: 'auth_code_xyz',
        integrationId: TP_ID.bullhorn,
        revertPublicKey: 'pub_key_123',
        svixAppId: 'svix_123',
        environmentId: 'env_123',
        tenantId: 'tenant_123',
        tenantSecretToken: 'sec_tok_123',
        response: mockResponse,
        redirectUrl: 'https://example.com/callback',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Constants & Config', () => {
        it('should correctly define mapIntegrationIdToIntegrationName for Bullhorn', () => {
            expect(mapIntegrationIdToIntegrationName[TP_ID.bullhorn]).toBe('Bullhorn');
        });

        it('should correctly register bullhorn in DEFAULT_SCOPE', () => {
            expect(DEFAULT_SCOPE[TP_ID.bullhorn]).toBeDefined();
            expect(Array.isArray(DEFAULT_SCOPE[TP_ID.bullhorn])).toBe(true);
        });
    });

    describe('handleOAuth', () => {
        it('should successfully exchange authorization code, perform REST login, and upsert connection', async () => {
            const mockedAxios = axios as unknown as jest.Mock;
            mockedAxios
                .mockResolvedValueOnce({
                    data: {
                        access_token: 'mock_bh_access_token',
                        refresh_token: 'mock_bh_refresh_token',
                    },
                })
                .mockResolvedValueOnce({
                    data: {
                        BhRestToken: 'rest_token_abc123',
                        restUrl: 'https://rest99.bullhornstaffing.com/rest-services/corp123/',
                    },
                });

            (xprisma.connections.upsert as jest.Mock).mockResolvedValueOnce({});
            (sendConnectionAddedEvent as jest.Mock).mockResolvedValueOnce({});

            await bullhorn.handleOAuth(baseAuthProps);

            expect(mockedAxios).toHaveBeenCalledTimes(2);
            expect(xprisma.connections.upsert).toHaveBeenCalledTimes(1);

            const upsertCall = (xprisma.connections.upsert as jest.Mock).mock.calls[0][0];
            expect(upsertCall.where.id).toBe('tenant_123');
            expect(upsertCall.create.tp_id).toBe(TP_ID.bullhorn);
            expect(upsertCall.create.tp_customer_id).toBe('Bullhorn_user');

            const tokenPayload = JSON.parse(upsertCall.create.tp_access_token);
            expect(tokenPayload.BhRestToken).toBe('rest_token_abc123');
            expect(tokenPayload.restUrl).toContain('bullhornstaffing.com');

            expect(sendConnectionAddedEvent).toHaveBeenCalledWith(
                'svix_123',
                'tenant_123',
                TP_ID.bullhorn,
                'rest_token_abc123',
                'Bullhorn_user'
            );

            expect(processOAuthResult).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: true,
                    tenantId: 'tenant_123',
                    integrationName: 'Bullhorn',
                    tpCustomerId: 'Bullhorn_user',
                })
            );
        });

        it('should accept pre-formatted JSON token payload directly', async () => {
            const mockedAxios = axios as unknown as jest.Mock;
            (xprisma.connections.upsert as jest.Mock).mockResolvedValueOnce({});
            (sendConnectionAddedEvent as jest.Mock).mockResolvedValueOnce({});

            const directProps = {
                ...baseAuthProps,
                code: JSON.stringify({
                    BhRestToken: 'direct_rest_tok',
                    restUrl: 'https://rest10.bullhornstaffing.com/rest-services/c456/',
                }),
            };

            await bullhorn.handleOAuth(directProps);

            expect(xprisma.connections.upsert).toHaveBeenCalledTimes(1);
            expect(processOAuthResult).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: true,
                    integrationName: 'Bullhorn',
                })
            );
        });

        it('should handle OAuth exchange failure gracefully', async () => {
            const mockedAxios = axios as unknown as jest.Mock;
            mockedAxios.mockRejectedValueOnce(new Error('OAuth failed with 401 Unauthorized'));

            await bullhorn.handleOAuth(baseAuthProps);

            expect(processOAuthResult).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: false,
                    integrationName: 'Bullhorn',
                })
            );
        });
    });
});
