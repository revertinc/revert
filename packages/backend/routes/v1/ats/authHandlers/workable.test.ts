import workableAuthHandler from './workable';
import { xprisma } from '../../../../prisma/client';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import axios from 'axios';
import { TP_ID } from '@prisma/client';

jest.mock('axios');
const mockedAxios = axios as unknown as { get: jest.Mock; post: jest.Mock };

jest.mock('../../../../helpers/logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
    logDebug: jest.fn(),
}));

jest.mock('../../../../redis/client', () => ({
    get: jest.fn(),
    set: jest.fn(),
    setEx: jest.fn(),
}));

jest.mock('../../../../helpers/auth/processOAuthResult', () => jest.fn());
jest.mock('../../../../helpers/webhooks/connection', () => jest.fn());

jest.mock('../../../../prisma/client', () => ({
    xprisma: {
        connections: {
            upsert: jest.fn().mockResolvedValue({ id: 'conn-1' }),
        },
    },
}));

const createMockProps = (overrides = {}) => ({
    account: {
        apps: [{ id: 'app-workable-1', app_config: { org_url: 'acme' } }],
    },
    code: 'waccess_token_123',
    integrationId: TP_ID.workable,
    revertPublicKey: 'revert_pub_pk',
    svixAppId: 'svix_app_1',
    environmentId: 'env_dev',
    tenantId: 'tenant_1',
    tenantSecretToken: 'secret_token_1',
    response: {} as any,
    request: { query: {}, headers: {} } as any,
    redirectUrl: undefined,
    ...overrides,
});

describe('WorkableAuthHandler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (processOAuthResult as jest.Mock).mockReset();
    });

    describe('handleBasicAuth', () => {
        it('returns failure when subdomain cannot be resolved from config, query, header, or /accounts', async () => {
            // /accounts endpoint fails or returns empty
            mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

            const props = createMockProps({
                account: {
                    apps: [{ id: 'app-1', app_config: {} }],
                },
            });

            await workableAuthHandler.handleBasicAuth(props as any);

            expect(processOAuthResult).toHaveBeenCalledTimes(1);
            const callArgs = (processOAuthResult as jest.Mock).mock.calls[0][0];
            expect(callArgs.status).toBe(false);
            expect(callArgs.statusText).toMatch(/subdomain is missing/i);
            expect(xprisma.connections.upsert).not.toHaveBeenCalled();
        });

        it('returns failure when API validation ping rejects token', async () => {
            mockedAxios.get.mockRejectedValueOnce({
                response: { status: 401 },
                message: 'Unauthorized',
            });

            const props = createMockProps();
            await workableAuthHandler.handleBasicAuth(props as any);

            expect(processOAuthResult).toHaveBeenCalledTimes(1);
            const callArgs = (processOAuthResult as jest.Mock).mock.calls[0][0];
            expect(callArgs.status).toBe(false);
            expect(callArgs.statusText).toMatch(/rejected by the API/i);
            expect(xprisma.connections.upsert).not.toHaveBeenCalled();
        });

        it('auto-discovers subdomain via /accounts when app_config has no subdomain', async () => {
            // First call to /accounts succeeds
            mockedAxios.get.mockResolvedValueOnce({
                status: 200,
                data: {
                    accounts: [{ id: 'acc_001', subdomain: 'discovered-org' }],
                },
            });
            // Second call to /jobs?limit=1 validation succeeds
            mockedAxios.get.mockResolvedValueOnce({
                status: 200,
                data: { jobs: [] },
            });

            const props = createMockProps({
                account: {
                    apps: [{ id: 'app-1', app_config: {} }],
                },
            });

            await workableAuthHandler.handleBasicAuth(props as any);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                'https://discovered-org.workable.com/spi/v3/jobs?limit=1',
                expect.objectContaining({
                    headers: expect.objectContaining({ Authorization: 'Bearer waccess_token_123' }),
                }),
            );

            expect(xprisma.connections.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    create: expect.objectContaining({
                        tp_customer_id: 'discovered-org',
                        tp_account_url: 'https://discovered-org.workable.com',
                        tp_access_token: 'waccess_token_123',
                        tp_id: TP_ID.workable,
                    }),
                }),
            );
        });

        it('validates token, upserts connection with account URL and emits Svix event', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                status: 200,
                data: { jobs: [] },
            });

            const props = createMockProps();
            await workableAuthHandler.handleBasicAuth(props as any);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                'https://acme.workable.com/spi/v3/jobs?limit=1',
                expect.objectContaining({
                    headers: expect.objectContaining({ Authorization: 'Bearer waccess_token_123' }),
                }),
            );

            expect(xprisma.connections.upsert).toHaveBeenCalledTimes(1);
            const upsertArgs = (xprisma.connections.upsert as jest.Mock).mock.calls[0][0];
            expect(upsertArgs.create.tp_customer_id).toBe('acme');
            expect(upsertArgs.create.tp_account_url).toBe('https://acme.workable.com');
            expect(upsertArgs.create.tp_access_token).toBe('waccess_token_123');
            expect(upsertArgs.create.tp_id).toBe(TP_ID.workable);

            expect(sendConnectionAddedEvent).toHaveBeenCalledWith(
                'svix_app_1',
                'tenant_1',
                TP_ID.workable,
                'waccess_token_123',
                'acme',
            );

            const resultArgs = (processOAuthResult as jest.Mock).mock.calls[0][0];
            expect(resultArgs.status).toBe(true);
            expect(resultArgs.tpCustomerId).toBe('acme');
        });
    });

    describe('handleOAuth', () => {
        it('exchanges authorization code, discovers accounts, upserts connection and sends Svix event', async () => {
            // OAuth token exchange response
            mockedAxios.post.mockResolvedValueOnce({
                status: 200,
                data: {
                    access_token: 'oauth_access_token_999',
                    refresh_token: 'oauth_refresh_token_888',
                    token_type: 'bearer',
                    expires_in: 7200,
                },
            });

            // /accounts user lookup
            mockedAxios.get.mockResolvedValueOnce({
                status: 200,
                data: {
                    accounts: [
                        {
                            id: 'acc_workable_123',
                            name: 'Initech Inc',
                            subdomain: 'initech-corp',
                        },
                    ],
                },
            });

            const props = createMockProps({
                clientId: 'workable_client_id_1',
                clientSecret: 'workable_client_secret_1',
                code: 'auth_code_xyz',
            });

            await workableAuthHandler.handleOAuth(props as any);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.stringContaining('/oauth/token'),
                expect.stringContaining('grant_type=authorization_code'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }),
                }),
            );

            expect(xprisma.connections.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    create: expect.objectContaining({
                        tp_access_token: 'oauth_access_token_999',
                        tp_refresh_token: 'oauth_refresh_token_888',
                        tp_account_url: 'https://initech-corp.workable.com',
                        tp_customer_id: 'acc_workable_123',
                        app_client_id: 'workable_client_id_1',
                        app_client_secret: 'workable_client_secret_1',
                    }),
                }),
            );

            expect(sendConnectionAddedEvent).toHaveBeenCalledWith(
                'svix_app_1',
                'tenant_1',
                TP_ID.workable,
                'oauth_access_token_999',
                'acc_workable_123',
            );

            const resultArgs = (processOAuthResult as jest.Mock).mock.calls[0][0];
            expect(resultArgs.status).toBe(true);
            expect(resultArgs.tpCustomerId).toBe('acc_workable_123');
        });

        it('handles OAuth token exchange error gracefully', async () => {
            mockedAxios.post.mockRejectedValueOnce({
                response: { data: { error: 'invalid_grant' } },
                message: 'OAuth exchange failed',
            });

            const props = createMockProps({
                clientId: 'client_id',
                clientSecret: 'client_secret',
                code: 'bad_code',
            });

            await workableAuthHandler.handleOAuth(props as any);

            expect(processOAuthResult).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: false,
                    tenantId: 'tenant_1',
                }),
            );
        });
    });
});
