import axios from 'axios';
import { TP_ID } from '@prisma/client';
import workdayHandler, { resolveWorkdayTokenUrl } from './workday';
import { xprisma } from '../../../../prisma/client';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import { IntegrationAuthProps } from '../../../../constants/common';

jest.mock('axios');
jest.mock('../../../../prisma/client', () => ({
    xprisma: {
        connections: {
            upsert: jest.fn(),
            update: jest.fn(),
        },
    },
}));
jest.mock('../../../../helpers/auth/processOAuthResult', () => jest.fn());
jest.mock('../../../../helpers/webhooks/connection', () => jest.fn());
jest.mock('../../../../helpers/logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
}));

const mockedAxios = axios as unknown as jest.Mock;

/**
 * Builds a deterministic IntegrationAuthProps fixture for Workday ATS unit tests.
 */
function createWorkdayAuthProps(overrides: Partial<IntegrationAuthProps> = {}): IntegrationAuthProps {
    return {
        integrationId: TP_ID.workday,
        account: {
            id: 'env_workday_1',
            env: 'production',
            private_token: 'sk_test',
            public_token: 'pk_test',
            accountId: 'acc_1',
            createdAt: new Date(),
            updatedAt: new Date(),
            apps: [
                {
                    id: 'app_workday_1',
                    app_config: {
                        org_url: 'https://wd5-impl-services1.workday.com',
                        tenant_name: 'acme_dpt1',
                    },
                },
            ],
        } as any,
        clientId: 'workday_client_id',
        clientSecret: 'workday_client_secret',
        code: 'wd_auth_code_123',
        revertPublicKey: 'pk_test',
        svixAppId: 'env_workday_1',
        environmentId: 'env_workday_1',
        tenantId: 'tenant_acme_1',
        tenantSecretToken: 'secret_tok_1',
        response: { send: jest.fn() } as any,
        request: {} as any,
        redirectUrl: 'https://app.revert.dev/callback',
        ...overrides,
    };
}

describe('WorkdayAuthHandler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('resolves tenant-specific Workday OAuth 2.0 token URLs from appConfig', () => {
        const resolved = resolveWorkdayTokenUrl({
            org_url: 'https://wd2-impl-services1.workday.com/',
            tenant_name: 'revert_gms',
        });
        expect(resolved).toBe('https://wd2-impl-services1.workday.com/ccx/oauth2/revert_gms/token');

        const directTokenUrl = resolveWorkdayTokenUrl(
            null,
            'https://wd3-services1.myworkday.com/ccx/oauth2/custom_tenant/token'
        );
        expect(directTokenUrl).toBe('https://wd3-services1.myworkday.com/ccx/oauth2/custom_tenant/token');
    });

    it('exchanges authorization code, upserts Workday connection, and dispatches Svix event', async () => {
        mockedAxios.mockResolvedValueOnce({
            data: {
                access_token: 'wd_access_999',
                refresh_token: 'wd_refresh_888',
                token_type: 'Bearer',
                expires_in: 3600,
            },
        });
        (processOAuthResult as jest.Mock).mockResolvedValueOnce({ status: 'ok' });

        const props = createWorkdayAuthProps();
        await workdayHandler.handleOAuth(props);

        expect(mockedAxios).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'post',
                url: 'https://wd5-impl-services1.workday.com/ccx/oauth2/acme_dpt1/token',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            })
        );
        expect(xprisma.connections.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'tenant_acme_1' },
                create: expect.objectContaining({
                    tp_id: TP_ID.workday,
                    tp_access_token: 'wd_access_999',
                    tp_refresh_token: 'wd_refresh_888',
                    tp_account_url: 'https://wd5-impl-services1.workday.com/ccx/oauth2/acme_dpt1/token',
                }),
            })
        );
        expect(sendConnectionAddedEvent).toHaveBeenCalledWith(
            'env_workday_1',
            'tenant_acme_1',
            TP_ID.workday,
            'wd_access_999',
            'Workday_user'
        );
        expect(processOAuthResult).toHaveBeenCalledWith(
            expect.objectContaining({ status: true, tenantId: 'tenant_acme_1', tpCustomerId: 'Workday_user' })
        );
    });

    it('reports failed OAuth exchange through processOAuthResult when token endpoint rejects code', async () => {
        const oauthError = new Error('invalid_grant');
        mockedAxios.mockRejectedValueOnce(oauthError);
        (processOAuthResult as jest.Mock).mockResolvedValueOnce({ status: 'error' });

        const props = createWorkdayAuthProps();
        await workdayHandler.handleOAuth(props);

        expect(xprisma.connections.upsert).not.toHaveBeenCalled();
        expect(processOAuthResult).toHaveBeenCalledWith(
            expect.objectContaining({
                status: false,
                error: oauthError,
                tenantId: 'tenant_acme_1',
            })
        );
    });

    it('rotates Workday access and refresh tokens via refreshAccessToken', async () => {
        mockedAxios.mockResolvedValueOnce({
            data: {
                access_token: 'wd_rotated_access_token',
                refresh_token: 'wd_rotated_refresh_token',
            },
        });

        const tokens = await workdayHandler.refreshAccessToken({
            connectionId: 'tenant_acme_1',
            refreshToken: 'wd_old_refresh_token',
            clientId: 'workday_client_id',
            clientSecret: 'workday_client_secret',
            tokenUrl: 'https://wd5-impl-services1.workday.com/ccx/oauth2/acme_dpt1/token',
        });

        expect(tokens.access_token).toBe('wd_rotated_access_token');
        expect(xprisma.connections.update).toHaveBeenCalledWith({
            where: { id: 'tenant_acme_1' },
            data: {
                tp_access_token: 'wd_rotated_access_token',
                tp_refresh_token: 'wd_rotated_refresh_token',
            },
        });
    });
});
