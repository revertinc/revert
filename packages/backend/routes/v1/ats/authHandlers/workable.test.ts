import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import axios from 'axios';
import workableAuthHandler, { normalizeWorkableBaseUrl } from './workable';
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
}));
jest.mock('../../../../helpers/auth/processOAuthResult', () => jest.fn());
jest.mock('../../../../helpers/webhooks/connection', () => jest.fn());
jest.mock('../../../../helpers/logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
}));

describe('Workable Integration AuthHandler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('normalizes Workable base URL from org_url or subdomain', () => {
        expect(normalizeWorkableBaseUrl('https://acme.workable.com/')).toBe('https://acme.workable.com');
        expect(normalizeWorkableBaseUrl('acme.workable.com')).toBe('https://acme.workable.com');
        expect(normalizeWorkableBaseUrl('acme')).toBe('https://acme.workable.com');
        expect(normalizeWorkableBaseUrl(undefined, 'beta-corp')).toBe('https://beta-corp.workable.com');
        expect(normalizeWorkableBaseUrl()).toBe('https://www.workable.com');
    });

    it('exchanges OAuth code, discovers account subdomain, and upserts connection', async () => {
        const mockedAxios = axios as unknown as jest.Mock;
        mockedAxios
            .mockResolvedValueOnce({
                data: {
                    access_token: 'wk_access_123',
                    refresh_token: 'wk_refresh_456',
                },
            })
            .mockResolvedValueOnce({
                data: {
                    accounts: [{ id: 'acc_1', subdomain: 'acme' }],
                },
            });

        await workableAuthHandler.handleOAuth({
            account: {
                id: 'env_1',
                apps: [{ id: 'app_1', app_config: {} }],
            } as any,
            clientId: 'client_123',
            clientSecret: 'secret_456',
            code: 'oauth_code_789',
            integrationId: 'workable' as any,
            revertPublicKey: 'pk_test_1',
            svixAppId: 'env_1',
            environmentId: 'env_1',
            tenantId: 'tenant_1',
            tenantSecretToken: 'secret_token_1',
            response: {} as any,
            request: {} as any,
            redirectUrl: 'https://example.com/callback',
        });

        expect(xprisma.connections.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'tenant_1' },
                create: expect.objectContaining({
                    tp_id: 'workable',
                    tp_access_token: 'wk_access_123',
                    tp_refresh_token: 'wk_refresh_456',
                    tp_customer_id: 'acc_1',
                    tp_account_url: 'https://acme.workable.com',
                }),
            }),
        );
        expect(sendConnectionAddedEvent).toHaveBeenCalledWith(
            'env_1',
            'tenant_1',
            'workable',
            'wk_access_123',
            'acc_1',
        );
        expect(processOAuthResult).toHaveBeenCalledWith(
            expect.objectContaining({
                status: true,
                tenantId: 'tenant_1',
                tpCustomerId: 'acc_1',
            }),
        );
    });
});
