import { jest, describe, expect, it, beforeEach } from '@jest/globals';
import axios from 'axios';
import workableAuthHandler from './workable';
import { xprisma } from '../../../../prisma/client';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';

jest.mock('axios');
jest.mock('../../../../prisma/client', () => ({
    xprisma: {
        connections: {
            upsert: jest.fn(),
        },
    },
    default: {},
}));
jest.mock('../../../../helpers/auth/processOAuthResult', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('../../../../helpers/webhooks/connection', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('../../../../helpers/logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
    logDebug: jest.fn(),
}));

describe('WorkableAuthHandler', () => {
    const baseProps: any = {
        account: {
            apps: [
                {
                    id: 'app_workable_1',
                    app_config: { subdomain: 'acme' },
                },
            ],
        },
        clientId: 'workable-client-id',
        clientSecret: 'workable-client-secret',
        code: 'oauth_code_123',
        integrationId: 'workable',
        revertPublicKey: 'pk_test_123',
        svixAppId: 'svix_123',
        environmentId: 'env_123',
        tenantId: 'tenant_123',
        tenantSecretToken: 'secret_123',
        response: {},
        request: { query: {} },
        redirectUrl: 'https://example.com/callback',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('exchanges OAuth authorization code and upserts Workable connection', async () => {
        (axios as unknown as jest.Mock).mockResolvedValueOnce({
            data: {
                access_token: 'wk_access_token_abc',
                refresh_token: 'wk_refresh_token_xyz',
            },
        } as never);

        await workableAuthHandler.handleOAuth(baseProps);

        expect(axios).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'post',
                url: 'https://www.workable.com/oauth/token',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }),
        );
        expect(xprisma.connections.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'tenant_123' },
                create: expect.objectContaining({
                    id: 'tenant_123',
                    t_id: 'tenant_123',
                    tp_id: 'workable',
                    tp_access_token: 'wk_access_token_abc',
                    tp_refresh_token: 'wk_refresh_token_xyz',
                    tp_account_url: 'https://acme.workable.com',
                    tp_customer_id: 'Workable_user',
                }),
            }),
        );
        expect(sendConnectionAddedEvent).toHaveBeenCalledWith(
            'svix_123',
            'tenant_123',
            'workable',
            'wk_access_token_abc',
            'Workable_user',
        );
        expect(processOAuthResult).toHaveBeenCalledWith(
            expect.objectContaining({
                status: true,
                tenantId: 'tenant_123',
                integrationName: 'Workable',
                tpCustomerId: 'Workable_user',
            }),
        );
    });

    it('supports API access token connection via handleBasicAuth', async () => {
        await workableAuthHandler.handleBasicAuth({
            ...baseProps,
            code: 'wk_api_access_token_999',
            request: { query: { subdomain: 'mycompany' } },
        });

        expect(xprisma.connections.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'tenant_123' },
                create: expect.objectContaining({
                    tp_id: 'workable',
                    tp_access_token: 'wk_api_access_token_999',
                    tp_account_url: 'https://mycompany.workable.com',
                    tp_customer_id: 'Workable_user',
                }),
            }),
        );
        expect(processOAuthResult).toHaveBeenCalledWith(
            expect.objectContaining({
                status: true,
                integrationName: 'Workable',
            }),
        );
    });

    it('handles OAuth token exchange failure gracefully', async () => {
        const err = new Error('Invalid authorization code');
        (axios as unknown as jest.Mock).mockRejectedValueOnce(err as never);

        await workableAuthHandler.handleOAuth(baseProps);

        expect(processOAuthResult).toHaveBeenCalledWith(
            expect.objectContaining({
                status: false,
                error: err,
                integrationName: 'Workable',
            }),
        );
    });
});
