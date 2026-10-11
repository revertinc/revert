import workableAuthHandler from './workable';
import { xprisma } from '../../../../prisma/client';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as unknown as { get: jest.Mock };

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

const baseProps = (appConfig: any) => ({
    account: {
        apps: [{ id: 'app-1', app_config: appConfig }],
    },
    code: 'wptok_123',
    integrationId: 'workable',
    revertPublicKey: 'pk',
    svixAppId: 'svix-app',
    environmentId: 'env-1',
    tenantId: 'tenant-1',
    tenantSecretToken: 'secret-1',
    response: {} as any,
    request: {} as any,
    redirectUrl: undefined,
});

describe('WorkableAuthHandler.handleBasicAuth', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (processOAuthResult as jest.Mock).mockReset();
    });

    it('fails with a clear message when the subdomain is missing', async () => {
        await workableAuthHandler.handleBasicAuth(baseProps({}) as any);

        expect(processOAuthResult).toHaveBeenCalledTimes(1);
        const args = (processOAuthResult as jest.Mock).mock.calls[0][0];
        expect(args.status).toBe(false);
        expect(args.statusText).toMatch(/subdomain is missing/i);
        expect(xprisma.connections.upsert).not.toHaveBeenCalled();
    });

    it('fails when the API rejects the token', async () => {
        mockedAxios.get.mockRejectedValueOnce({
            response: { status: 401 },
            message: 'Request failed',
        });

        await workableAuthHandler.handleBasicAuth(baseProps({ org_url: 'acme' }) as any);

        const args = (processOAuthResult as jest.Mock).mock.calls[0][0];
        expect(args.status).toBe(false);
        expect(args.statusText).toMatch(/rejected by the API/i);
        expect(xprisma.connections.upsert).not.toHaveBeenCalled();
    });

    it('validates the token, upserts the connection with the subdomain and emits the event', async () => {
        mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { jobs: [] } } as any);

        await workableAuthHandler.handleBasicAuth(baseProps({ org_url: 'https://acme.workable.com' }) as any);

        // validation ping
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'https://acme.workable.com/spi/v3/jobs?limit=1',
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: 'Bearer wptok_123' }),
            }),
        );

        // connection upsert carries the subdomain in tp_customer_id + tp_account_url
        expect(xprisma.connections.upsert).toHaveBeenCalledTimes(1);
        const upsertArgs = (xprisma.connections.upsert as jest.Mock).mock.calls[0][0];
        expect(upsertArgs.create.tp_customer_id).toBe('acme');
        expect(upsertArgs.create.tp_account_url).toBe('https://acme.workable.com');
        expect(upsertArgs.create.tp_access_token).toBe('wptok_123');
        expect(upsertArgs.create.tp_id).toBe('workable');

        expect(sendConnectionAddedEvent).toHaveBeenCalledWith('svix-app', 'tenant-1', 'workable', 'wptok_123', 'acme');

        const args = (processOAuthResult as jest.Mock).mock.calls[0][0];
        expect(args.status).toBe(true);
        expect(args.tpCustomerId).toBe('acme');
    });
});
