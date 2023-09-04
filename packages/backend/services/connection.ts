import { ConnectionService } from '../generated/typescript/api/resources/connection/service/ConnectionService';
import prisma, { xprisma } from '../prisma/client';
import config from '../config';
import logError from '../helpers/logError';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, UnAuthorizedError } from '../generated/typescript/api/resources/common/resources';

const connectionService = new ConnectionService({
    async getConnection(req, res) {
        const { 'x-revert-api-token': token, 'x-revert-t-id': tenantId } = req.headers;
        if (!token) {
            throw new UnAuthorizedError({ error: 'Api unauthorized' });
        }
        if (!tenantId) {
            throw new NotFoundError({ error: 'Tenant not found!' });
        }
        const connection: any = await xprisma.connections.findFirst({
            where: {
                AND: [
                    { t_id: tenantId as string },
                    {
                        app: {
                            env: {
                                private_token: token as string,
                            },
                        },
                    },
                ],
            },
            select: {
                tp_access_token: true,
                tp_id: true,
                t_id: true,
                tp_account_url: true,
                tp_customer_id: true,
            },
        });
        if (connection) {
            res.send(connection);
        } else {
            throw new NotFoundError({ error: 'Connection not found!' });
        }
    },
    async getAllConnections(req, res) {
        const { 'x-revert-api-token': token } = req.headers;
        const connections: any = await xprisma.connections.findMany({
            where: {
                app: {
                    env: {
                        is: {
                            private_token: String(token),
                        },
                    },
                },
            },
            select: {
                tp_id: true,
                tp_access_token: true,
                tp_refresh_token: true,
                tp_customer_id: true,
                t_id: true,
            },
        });
        if (connections.length > 0) {
            res.send(connections);
        } else {
            throw new NotFoundError({ error: 'Connections not found!' });
        }
    },
    async deleteConnection(req, res) {
        const { 'x-revert-api-token': token, 'x-revert-t-id': tenantId } = req.headers;
        if (!token) {
            throw new UnAuthorizedError({ error: 'Api unauthorized' });
        }
        if (!tenantId) {
            throw new NotFoundError({ error: 'Tenant not found!' });
        }
        const connection: any = await prisma.connections.findFirst({
            where: {
                t_id: tenantId as string,
                app: {
                    env: {
                        private_token: token as string,
                    },
                },
            },
            select: {
                tp_access_token: true,
                tp_id: true,
                t_id: true,
                tp_account_url: true,
                tp_customer_id: true,
            },
        });

        const environment = await prisma.environments.findFirst({
            where: {
                private_token: String(token),
            },
        });
        const svixAppId = environment?.accountId!;
        const deleted: any = await prisma.connections.delete({
            // TODO: Add environments to connections.
            where: {
                id: connection.id,
            },
        });
        if (deleted) {
            config.svix.message.create(svixAppId, {
                eventType: 'connection.deleted',
                payload: {
                    eventType: 'connection.deleted',
                    connection,
                },
                channels: [connection.t_id],
            });
            res.send({ status: 'ok', deleted });
        } else {
            throw new NotFoundError({ error: 'Connections not found!' });
        }
    },
    async createWebhook(req, res) {
        try {
            const { 'x-revert-api-token': token, 'x-revert-t-id': tenantId } = req.headers;
            const webhookUrl = req.body.webhookUrl;
            const environment = await prisma.environments.findFirst({
                where: {
                    private_token: String(token),
                },
            });
            const svixAppId = environment?.accountId!;
            const secret = `whsec_${Buffer.from(uuidv4()).toString('base64')}`;
            const webhook = await config.svix.endpoint.create(svixAppId, {
                url: webhookUrl,
                version: 1,
                description: `Connection Webhook for tenant ${tenantId}`,
                uid: String(tenantId),
                channels: [String(tenantId)],
                secret: secret,
            });
            res.send({
                status: 'ok',
                webhookUrl: webhook.url,
                createdAt: String(webhook.createdAt),
                secret: secret,
            });
        } catch (error: any) {
            logError(error);
            console.error(error);
            res.send({
                error: 'Error creating webhook!',
                errorMessage: error,
                status: 'error',
                webhookUrl: '',
                createdAt: '',
                secret: '',
            });
        }
    },
    async getWebhook(req, res) {
        try {
            const { 'x-revert-api-token': token, 'x-revert-t-id': tenantId } = req.headers;
            const environment = await prisma.environments.findFirst({
                where: {
                    private_token: String(token),
                },
            });
            const svixAppId = environment?.accountId!;
            const webhook = await config.svix.endpoint.get(svixAppId, String(tenantId));
            res.send({ status: 'ok', webhook: webhook });
        } catch (error: any) {
            logError(error);
            console.error(error);
            res.send({
                status: 'error',
                error: 'Error fetching webhook!',
                errorMessage: error,
            });
        }
    },

    async deleteWebhook(req, res) {
        try {
            const { 'x-revert-api-token': token, 'x-revert-t-id': tenantId } = req.headers;
            const webhookId = String(tenantId);
            const environment = await prisma.environments.findFirst({
                where: {
                    private_token: String(token),
                },
            });
            const svixAppId = environment?.accountId!;
            await config.svix.endpoint.delete(svixAppId, webhookId);
            res.send({ status: 'ok' });
        } catch (error: any) {
            logError(error);
            console.error(error);
            res.send({
                status: 'error',
                error: 'Error deleting webhook!',
                errorMessage: error,
            });
        }
    },
});

export { connectionService };
