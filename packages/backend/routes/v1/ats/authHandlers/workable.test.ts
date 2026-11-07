import axios from 'axios';
import qs from 'qs';
import workableAuthHandler, {
    WORKABLE_AUTHORIZE_URL,
    WORKABLE_CUSTOMER_ID,
    WORKABLE_DEFAULT_SCOPES,
    WORKABLE_INTEGRATION_NAME,
    WORKABLE_TOKEN_URL,
    WORKABLE_TP_ID,
} from './workable';
import { xprisma } from '../../../../prisma/client';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import { IntegrationAuthProps } from '../../../../constants/common';

jest.mock('axios');
jest.mock('../../../../config', () => ({
    __esModule: true,
    default: {
        OAUTH_REDIRECT_BASE: 'https://api.revert.dev/oauth-callback',
        WORKABLE_CLIENT_ID: 'env-workable-client-id',
        WORKABLE_CLIENT_SECRET: 'env-workable-client-secret',
    },
}));
jest.mock('../../../../helpers/logger', () => ({
    logInfo: jest.fn(),
}));
jest.mock('../../../../prisma/client', () => ({
    xprisma: {
        connections: {
            upsert: jest.fn(),
            update: jest.fn(),
        },
    },
}));
jest.mock('../../../../helpers/auth/processOAuthResult', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('../../../../helpers/webhooks/connection', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const mockedAxios = axios as unknown as jest.Mock;
const mockedUpsert = xprisma.connections.upsert as jest.Mock;
const mockedUpdate = xprisma.connections.update as jest.Mock;
const mockedProcessOAuthResult = processOAuthResult as jest.Mock;
const mockedSendConnectionAddedEvent = sendConnectionAddedEvent as jest.Mock;

/**
 * Constructs a deterministic `IntegrationAuthProps` fixture for Workable OAuth callback unit tests.
 */
function createAuthPropsFixture(overrides: Partial<IntegrationAuthProps> = {}): IntegrationAuthProps {
    return {
        integrationId: WORKABLE_TP_ID,
        account: {
            id: 'env_123',
            apps: [
                {
                    id: 'app_456',
                    app_config: { org_url: 'https://acme.workable.com' },
                },
            ],
        } as any,
        clientId: 'tenant-client-id',
        clientSecret: 'tenant-client-secret',
        code: 'workable-auth-code-xyz',
        revertPublicKey: 'pk_live_revert_001',
        svixAppId: 'svix_env_123',
        environmentId: 'env_123',
        tenantId: 'tenant_789',
        tenantSecretToken: 'secret_tok_999',
        response: { send: jest.fn() } as any,
        request: {} as any,
        redirectUrl: 'https://app.customer.io/integrations',
        ...overrides,
    };
}

/**
 * Unit tests verifying Workable OAuth 2.0 URL generation, token exchange, connection persistence, and error handling.
 */
describe('WorkableAuthHandler OAuth 2.0 flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('builds the Workable authorization URL with default scopes and user resource parameter', () => {
        const url = workableAuthHandler.getAuthorizationUrl({
            clientId: 'custom-client',
            state: 'tenant_state_1',
        });

        const [baseUrl, queryString] = url.split('?');
        const parsedQuery = qs.parse(queryString);

        expect(baseUrl).toBe(WORKABLE_AUTHORIZE_URL);
        expect(parsedQuery).toEqual({
            client_id: 'custom-client',
            redirect_uri: 'https://api.revert.dev/oauth-callback/workable',
            response_type: 'code',
            resource: 'user',
            scope: WORKABLE_DEFAULT_SCOPES.join(' '),
            state: 'tenant_state_1',
        });
    });

    it('exchanges the authorization code, upserts the connection, and dispatches Svix webhook', async () => {
        mockedAxios.mockResolvedValueOnce({
            data: {
                access_token: 'wk_access_001',
                refresh_token: 'wk_refresh_001',
            },
        });
        mockedProcessOAuthResult.mockResolvedValueOnce({ status: 'ok' });

        const props = createAuthPropsFixture();
        await workableAuthHandler.handleOAuth(props);

        expect(mockedAxios).toHaveBeenCalledWith({
            method: 'post',
            url: WORKABLE_TOKEN_URL,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: qs.stringify({
                grant_type: 'authorization_code',
                client_id: 'tenant-client-id',
                client_secret: 'tenant-client-secret',
                code: 'workable-auth-code-xyz',
                redirect_uri: 'https://api.revert.dev/oauth-callback/workable',
            }),
        });
        expect(mockedUpsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'tenant_789' },
            }),
        );
        expect(mockedSendConnectionAddedEvent).toHaveBeenCalledWith(
            'svix_env_123',
            'tenant_789',
            WORKABLE_TP_ID,
            'wk_access_001',
            WORKABLE_CUSTOMER_ID,
        );
        expect(mockedProcessOAuthResult).toHaveBeenCalledWith(
            expect.objectContaining({
                status: true,
                tenantId: 'tenant_789',
                integrationName: WORKABLE_INTEGRATION_NAME,
                tpCustomerId: WORKABLE_CUSTOMER_ID,
            }),
        );
    });

    it('reports OAuth failure through processOAuthResult when token exchange rejects', async () => {
        const exchangeError = new Error('Invalid authorization grant');
        mockedAxios.mockRejectedValueOnce(exchangeError);
        mockedProcessOAuthResult.mockResolvedValueOnce({ status: 'error' });

        const props = createAuthPropsFixture();
        await workableAuthHandler.handleOAuth(props);

        expect(mockedUpsert).not.toHaveBeenCalled();
        expect(mockedProcessOAuthResult).toHaveBeenCalledWith(
            expect.objectContaining({
                status: false,
                error: exchangeError,
                tenantId: 'tenant_789',
            }),
        );
    });
});

/**
 * Unit tests verifying background refresh token rotation for stored Workable connections.
 */
describe('WorkableAuthHandler token refresh lifecycle', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns null without calling Workable when the connection lacks a refresh token', async () => {
        const result = await workableAuthHandler.refreshAccessToken({
            id: 'conn_no_refresh',
            tp_refresh_token: null,
        });

        expect(result).toBeNull();
        expect(mockedAxios).not.toHaveBeenCalled();
        expect(mockedUpdate).not.toHaveBeenCalled();
    });

    it('rotates the access token using platform credentials for Revert-managed apps and updates Prisma', async () => {
        mockedAxios.mockResolvedValueOnce({
            data: {
                access_token: 'wk_rotated_access',
                refresh_token: 'wk_rotated_refresh',
            },
        });

        const tokens = await workableAuthHandler.refreshAccessToken({
            id: 'conn_revert_managed',
            tp_refresh_token: 'wk_old_refresh',
            app: { is_revert_app: true },
        });

        expect(tokens?.access_token).toBe('wk_rotated_access');
        expect(mockedAxios).toHaveBeenCalledWith({
            method: 'post',
            url: WORKABLE_TOKEN_URL,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: qs.stringify({
                grant_type: 'refresh_token',
                client_id: 'env-workable-client-id',
                client_secret: 'env-workable-client-secret',
                refresh_token: 'wk_old_refresh',
            }),
        });
        expect(mockedUpdate).toHaveBeenCalledWith({
            where: { id: 'conn_revert_managed' },
            data: {
                tp_access_token: 'wk_rotated_access',
                tp_refresh_token: 'wk_rotated_refresh',
            },
        });
    });
});
