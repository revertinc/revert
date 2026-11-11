import { ConnectionService } from '../generated/typescript/api/resources/connection/service/ConnectionService';
import prisma, { xprisma } from '../prisma/client';
import config from '../config';
import { logError } from '../helpers/logger';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, UnAuthorizedError } from '../generated/typescript/api/resources/common/resources';
import { sendConnectionDeletedEvent } from '../helpers/webhooks/connection';

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
                app_config: true,
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
                app_config: true,
            },
        });
        if (connections.length > 0) {
            res.send(connections);
        } else {
            throw new NotFoundError({ error: 'Connections not found!' });
        }
    },
    async importConnections(req, res) {
        const { 'x-revert-api-token': token } = req.headers;
        if (!token) {
            throw new UnAuthorizedError({ error: 'Api unauthorized' });
        }
        try {
            const environment = await prisma.environments.findFirst({
                where: {
                    private_token: String(token),
                },
            });
            if (!environment) {
                throw new UnAuthorizedError({ error: 'Api unauthorized' });
            }
            const connectionsData = req.body.connections;
            const createdConnections = await Promise.all(
                connectionsData.map(async (connection) => {
                    return await xprisma.connections.upsert({
                        where: {
                            id: connection.t_id,
                        },
                        update: {
                            id: connection.t_id,
                            t_id: connection.t_id,
                            tp_id: connection.tp_id,
                            tp_access_token: connection.tp_access_token,
                            tp_refresh_token: connection.tp_refresh_token,
                            app_client_id: connection.app_client_id,
                            app_client_secret: connection.app_client_secret,
                            tp_customer_id: connection.tp_customer_id,
                            owner_account_public_token: environment.public_token,
                            appId: connection.app_id,
                            tp_account_url: connection.tp_account_url,
                            environmentId: environment?.id,
                        },
                        create: {
                            id: connection.t_id,
                            t_id: connection.t_id,
                            tp_id: connection.tp_id,
                            tp_access_token: connection.tp_access_token,
                            tp_refresh_token: connection.tp_refresh_token,
                            app_client_id: connection.app_client_id,
                            app_client_secret: connection.app_client_secret,
                            tp_customer_id: connection.tp_customer_id,
                            owner_account_public_token: environment.public_token,
                            appId: connection.app_id,
                            tp_account_url: connection.tp_account_url,
                            environmentId: environment?.id,
                        },
                    });
                }),
            );

            if (createdConnections) {
                // TODO: Should webhooks get fired for bulk import of connections?
                // const svixAppId = environment?.id!;
                // createdConnections.forEach((c) => sendConnectionDeletedEvent(svixAppId, c));
                res.send({ status: 'ok' });
            } else {
                throw new NotFoundError({ error: 'Connections not imported!' });
            }
        } catch (error: any) {
            logError(error);
            console.error(error);
            res.send({
                status: 'error',
            });
        }
    },
    async deleteConnection(req, res) {
        // changes(breaking) -> Delete Connection on SvixAppId -> accoundId_environment that is environmentId
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
                id: true,
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
        const svixAppId = environment?.id!;
        const deleted: any = await prisma.connections.delete({
            // TODO: Add environments to connections.
            where: {
                id: connection.id,
            },
        });
        if (deleted) {
            await sendConnectionDeletedEvent(svixAppId, connection);
            res.send({ status: 'ok', deleted });
        } else {
            throw new NotFoundError({ error: 'Connections not found!' });
        }
    },
    async createWebhook(req, res) {
        // Support event-based webhook subscriptions (Issue #495) as well as tenant-scoped webhooks
        try {
            const { 'x-revert-api-token': token } = req.headers;
            const tenantId = req.headers['x-revert-t-id'] || req.body?.t_id || req.body?.tenantId;
            const { webhookUrl, eventTypes, filterTypes, description, uid } = req.body;
            const environment = await prisma.environments.findFirst({
                where: {
                    private_token: String(token),
                },
            });

            if (!environment) {
                throw new UnAuthorizedError({ error: 'Api unauthorized' });
            }

            const svixAppId = environment.id;
            const secret = `whsec_${Buffer.from(uuidv4()).toString('base64')}`;

            const endpointPayload: any = {
                url: webhookUrl,
                version: 1,
                secret: secret,
            };

            const selectedFilterTypes = filterTypes || eventTypes;
            if (Array.isArray(selectedFilterTypes) && selectedFilterTypes.length > 0) {
                endpointPayload.filterTypes = selectedFilterTypes;
            }

            if (tenantId) {
                endpointPayload.uid = uid ? String(uid) : String(tenantId);
                endpointPayload.description = description || `Connection Webhook for tenant ${tenantId}`;
                endpointPayload.channels = [String(tenantId)];
            } else {
                endpointPayload.uid = uid ? String(uid) : `wh_${uuidv4()}`;
                endpointPayload.description = description || 'Global Event Webhook Subscription';
                // Channels is omitted so endpoint receives events across all tenants
            }

            const webhook = await config.svix!.endpoint.create(svixAppId, endpointPayload);
            res.send({
                status: 'ok',
                webhookId: webhook.id || webhook.uid || endpointPayload.uid,
                uid: webhook.uid || endpointPayload.uid,
                webhookUrl: webhook.url,
                createdAt: String(webhook.createdAt),
                secret: secret,
                channels: webhook.channels || endpointPayload.channels,
                filterTypes: webhook.filterTypes || endpointPayload.filterTypes,
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
            const { 'x-revert-api-token': token } = req.headers;
            const webhookId = (req as any).params?.webhookId || (req as any).query?.webhookId || (req as any).query?.id || req.headers['x-revert-t-id'];
            const environment = await prisma.environments.findFirst({
                where: {
                    private_token: String(token),
                },
            });

            if (!environment) {
                throw new UnAuthorizedError({ error: 'Api unauthorized' });
            }

            const svixAppId = environment.id;
            if (webhookId) {
                const webhook = await config.svix!.endpoint.get(svixAppId, String(webhookId));
                res.send({ status: 'ok', webhook: webhook });
            } else {
                const webhooks = await config.svix!.endpoint.list(svixAppId);
                res.send({ status: 'ok', webhooks: (webhooks as any)?.data || webhooks });
            }
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
            const { 'x-revert-api-token': token } = req.headers;
            const webhookId = (req as any).params?.webhookId || req.body?.webhookId || (req as any).query?.webhookId || (req as any).query?.id || req.headers['x-revert-t-id'];
            const environment = await prisma.environments.findFirst({
                where: {
                    private_token: String(token),
                },
            });

            if (!environment) {
                throw new UnAuthorizedError({ error: 'Api unauthorized' });
            }

            if (!webhookId) {
                res.send({
                    status: 'error',
                    error: 'Error deleting webhook!',
                    errorMessage: 'webhookId or x-revert-t-id header is required',
                });
                return;
            }

            const svixAppId = environment.id;
            await config.svix!.endpoint.delete(svixAppId, String(webhookId));
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
    async getIntegrationStatus(_req, _res) {
        // Note: DUMMY method since real implementation is in routes/index.ts because for some reason
        // This endpoint is not working for a ServerResponse type of responseBody.
    },
});

export { connectionService };
