import { jest, describe, expect, it, beforeEach } from '@jest/globals';
import axios from 'axios';
import { TP_ID } from '@prisma/client';

import workableHandler from './workable';
import { xprisma } from '../../../../prisma/client';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import { DEFAULT_SCOPE, mapIntegrationIdToIntegrationName } from '../../../../constants/common';

jest.mock('axios');
jest.mock('../../../../config', () => ({
    __esModule: true,
    default: {
        OAUTH_REDIRECT_BASE: 'https://api.revert.ai/callback',
        WORKABLE_CLIENT_ID: 'env-client-id',
        WORKABLE_CLIENT_SECRET: 'env-client-secret',
    },
}));
jest.mock('../../../../helpers/logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
}));
jest.mock('../../../../prisma/client', () => ({
    xprisma: { connections: { upsert: jest.fn() } },
}));
jest.mock('../../../../helpers/auth/processOAuthResult', () => ({
    __esModule: true,
    default: jest.fn(async () => undefined),
}));
jest.mock('../../../../helpers/webhooks/connection', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const buildProps = () => ({
    account: { apps: [{ id: 'app-id' }] },
    clientId: null,
    clientSecret: null,
    code: 'auth-code',
    integrationId: TP_ID.workable,
    revertPublicKey: 'revert-pub-key',
    svixAppId: 'svix-app-id',
    environmentId: 'env-id',
    tenantId: 'tenant-id',
    tenantSecretToken: 'tenant-secret-token',
    response: { send: jest.fn() },
    request: {},
});

describe('Workable OAuth Handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (axios as any).mockResolvedValue({
            data: { access_token: 'workable-access-token', refresh_token: 'workable-refresh-token' },
        });
    });

    it('exchanges the code at workable token endpoint and persists both tokens', async () => {
        await workableHandler.handleOAuth(buildProps() as any);

        expect(axios).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'post',
                url: 'https://www.workable.com/oauth/token',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: expect.stringMatching(/grant_type=authorization_code/),
            }),
        );
        const formData = (axios as any).mock.calls[0][0].data;
        expect(formData).toContain('code=auth-code');
        expect(formData).toContain('client_id=env-client-id');

        expect(xprisma.connections.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'tenant-id' },
                create: expect.objectContaining({
                    tp_id: TP_ID.workable,
                    tp_access_token: 'workable-access-token',
                    tp_refresh_token: 'workable-refresh-token',
                }),
            }),
        );
    });

    it('emits connection.added webhook and returns success result', async () => {
        await workableHandler.handleOAuth(buildProps() as any);

        expect(sendConnectionAddedEvent).toHaveBeenCalledWith(
            'svix-app-id',
            'tenant-id',
            TP_ID.workable,
            'workable-access-token',
            'Workable_user',
        );
        expect(processOAuthResult).toHaveBeenCalledWith(
            expect.objectContaining({
                status: true,
                integrationName: 'Workable',
                tpCustomerId: 'Workable_user',
            }),
        );
    });

    it('returns failed result when connection upsert fails', async () => {
        (xprisma.connections.upsert as any).mockRejectedValueOnce(new Error('db down'));

        await workableHandler.handleOAuth(buildProps() as any);

        expect(processOAuthResult).toHaveBeenCalledWith(expect.objectContaining({ status: false }));
    });
});

describe('Workable constants mapping', () => {
    it('maps integration name and default scopes for workable', () => {
        expect(mapIntegrationIdToIntegrationName[TP_ID.workable]).toBe('Workable');
        expect(DEFAULT_SCOPE[TP_ID.workable]).toEqual(['r_jobs', 'r_candidates', 'w_candidates']);
    });
});
