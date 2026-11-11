import { jest, describe, expect, it, beforeEach } from '@jest/globals';
import { connectionService } from './connection';
import config from '../config';
import prisma from '../prisma/client';

jest.mock('../prisma/client', () => {
    return {
        __esModule: true,
        default: {
            environments: {
                findFirst: jest.fn(),
            },
        },
        xprisma: {
            connections: {
                findFirst: jest.fn(),
            },
        },
    };
});

jest.mock('../config', () => {
    return {
        __esModule: true,
        default: {
            svix: {
                endpoint: {
                    create: jest.fn(),
                    get: jest.fn(),
                    list: jest.fn(),
                    delete: jest.fn(),
                },
            },
        },
    };
});

describe('ConnectionService Webhook Subscriptions (Event-Based & Tenant-Scoped)', () => {
    const mockEnv = { id: 'env_123', private_token: 'test_token' };

    beforeEach(() => {
        jest.clearAllMocks();
        (prisma.environments.findFirst as any).mockResolvedValue(mockEnv);
    });

    it('should create an event-based webhook subscription across all tenants when tenantId is omitted', async () => {
        const mockCreatedEndpoint = {
            id: 'ep_event_1',
            uid: 'wh_test_uid',
            url: 'https://example.com/events',
            createdAt: new Date('2026-11-11T00:00:00Z'),
            filterTypes: ['connection.added', 'connection.deleted'],
        };
        (config.svix!.endpoint.create as any).mockResolvedValue(mockCreatedEndpoint);

        const req: any = {
            headers: {
                'x-revert-api-token': 'test_token',
            },
            body: {
                webhookUrl: 'https://example.com/events',
                eventTypes: ['connection.added', 'connection.deleted'],
                description: 'Global Event Webhook',
            },
        };

        const res: any = {
            send: jest.fn(),
        };

        await connectionService.createWebhook(req, res);

        expect(prisma.environments.findFirst).toHaveBeenCalledWith({
            where: { private_token: 'test_token' },
        });

        expect(config.svix!.endpoint.create).toHaveBeenCalledWith(
            'env_123',
            expect.objectContaining({
                url: 'https://example.com/events',
                version: 1,
                description: 'Global Event Webhook',
                filterTypes: ['connection.added', 'connection.deleted'],
            })
        );

        // Ensure channels was NOT set, allowing cross-tenant event reception
        const callArgs = (config.svix!.endpoint.create as any).mock.calls[0][1];
        expect(callArgs.channels).toBeUndefined();

        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'ok',
                webhookUrl: 'https://example.com/events',
                filterTypes: ['connection.added', 'connection.deleted'],
            })
        );
    });

    it('should preserve tenant-scoped channels when tenantId header is supplied', async () => {
        const mockCreatedEndpoint = {
            id: 'ep_tenant_1',
            uid: 'tenant_abc',
            url: 'https://example.com/tenant-webhook',
            createdAt: new Date('2026-11-11T00:00:00Z'),
            channels: ['tenant_abc'],
        };
        (config.svix!.endpoint.create as any).mockResolvedValue(mockCreatedEndpoint);

        const req: any = {
            headers: {
                'x-revert-api-token': 'test_token',
                'x-revert-t-id': 'tenant_abc',
            },
            body: {
                webhookUrl: 'https://example.com/tenant-webhook',
            },
        };

        const res: any = {
            send: jest.fn(),
        };

        await connectionService.createWebhook(req, res);

        expect(config.svix!.endpoint.create).toHaveBeenCalledWith(
            'env_123',
            expect.objectContaining({
                url: 'https://example.com/tenant-webhook',
                uid: 'tenant_abc',
                channels: ['tenant_abc'],
            })
        );

        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'ok',
                channels: ['tenant_abc'],
            })
        );
    });

    it('should list all webhook endpoints when no specific webhookId is provided in getWebhook', async () => {
        const mockList = {
            data: [
                { id: 'ep_1', url: 'https://example.com/1' },
                { id: 'ep_2', url: 'https://example.com/2' },
            ],
        };
        (config.svix!.endpoint.list as any).mockResolvedValue(mockList);

        const req: any = {
            headers: {
                'x-revert-api-token': 'test_token',
            },
        };
        const res: any = {
            send: jest.fn(),
        };

        await connectionService.getWebhook(req, res);

        expect(config.svix!.endpoint.list).toHaveBeenCalledWith('env_123');
        expect(res.send).toHaveBeenCalledWith({
            status: 'ok',
            webhooks: mockList.data,
        });
    });

    it('should delete a webhook by specified webhookId', async () => {
        (config.svix!.endpoint.delete as any).mockResolvedValue({});

        const req: any = {
            headers: {
                'x-revert-api-token': 'test_token',
            },
            body: {
                webhookId: 'wh_custom_123',
            },
        };
        const res: any = {
            send: jest.fn(),
        };

        await connectionService.deleteWebhook(req, res);

        expect(config.svix!.endpoint.delete).toHaveBeenCalledWith('env_123', 'wh_custom_123');
        expect(res.send).toHaveBeenCalledWith({ status: 'ok' });
    });
});
