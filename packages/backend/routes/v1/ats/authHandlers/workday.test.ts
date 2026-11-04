import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import axios from 'axios';
import workdayAuthHandler, { parseWorkdayOrgUrl } from './workday';
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

describe('Workday Integration AuthHandler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('parses Workday org_url into OAuth and REST API v1 endpoints', () => {
        const endpoints = parseWorkdayOrgUrl('https://wd2-impl-services1.workday.com/ccx/api/v1/acme_dpt1/');
        expect(endpoints).toEqual({
            hostUrl: 'https://wd2-impl-services1.workday.com',
            tenant: 'acme_dpt1',
            tokenUrl: 'https://wd2-impl-services1.workday.com/ccx/oauth2/acme_dpt1/token',
            authorizeUrl: 'https://wd2-impl-services1.workday.com/acme_dpt1/authorize',
            apiBaseUrl: 'https://wd2-impl-services1.workday.com/ccx/api/v1/acme_dpt1',
        });
    });

    it('exchanges OAuth code with Basic auth and upserts Workday connection', async () => {
        const mockedAxios = axios as unknown as jest.Mock;
        mockedAxios.mockResolvedValueOnce({
            data: {
                access_token: 'wd_access_123',
                refresh_token: 'wd_refresh_456',
            },
        });

        await workdayAuthHandler.handleOAuth({
            account: {
                id: 'env_1',
                apps: [
                    {
                        id: 'app_1',
                        is_revert_app: false,
                        app_config: { org_url: 'https://wd2-impl-services1.workday.com/ccx/api/v1/acme_dpt1' },
                    },
                ],
            } as any,
            clientId: 'wd_client_id',
            clientSecret: 'wd_client_secret',
            code: 'wd_auth_code',
            integrationId: 'workday' as any,
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
                    tp_id: 'workday',
                    tp_access_token: 'wd_access_123',
                    tp_refresh_token: 'wd_refresh_456',
                    tp_customer_id: 'Workday_acme_dpt1',
                    tp_account_url: 'https://wd2-impl-services1.workday.com/ccx/api/v1/acme_dpt1',
                }),
            }),
        );
        expect(sendConnectionAddedEvent).toHaveBeenCalledWith(
            'env_1',
            'tenant_1',
            'workday',
            'wd_access_123',
            'Workday_acme_dpt1',
        );
        expect(processOAuthResult).toHaveBeenCalledWith(
            expect.objectContaining({
                status: true,
                tenantId: 'tenant_1',
                tpCustomerId: 'Workday_acme_dpt1',
            }),
        );
    });
});
