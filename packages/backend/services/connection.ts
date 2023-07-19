import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import prisma from '../prisma/client';
import config from '../config';
import { Svix } from 'svix';
import logError from '../helpers/logError';
import { v4 as uuidv4 } from 'uuid';

class ConnectionService {
    public svix;
    constructor() {
        this.svix = new Svix(config.SVIX_AUTH_TOKEN!);
    }
    async getConnection(
        _req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        if (connection) {
            return connection;
        } else {
            return {
                error: 'Connection not found!',
            };
        }
    }
    async getAllConnections(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        _res: Response<any, Record<string, any>, number>
    ) {
        const { 'x-revert-api-token': token } = req.headers;
        const connections: any = await prisma.connections.findMany({
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
            return connections;
        } else {
            return {
                error: 'Connections not found!',
            };
        }
    }
    async deleteConnection(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const { 'x-revert-api-token': token } = req.headers;
        const account = await prisma.accounts.findFirst({
            where: {
                private_token: String(token),
            },
        });
        const svixAppId = account!.id;
        const deleted: any = await prisma.connections.delete({
            where: {
                uniqueCustomerPerTenantPerThirdParty: {
                    tp_customer_id: connection.tp_customer_id,
                    t_id: connection.t_id,
                    tp_id: connection.tp_id,
                },
            },
        });
        if (deleted) {
            this.svix.message.create(svixAppId, {
                eventType: 'connection.deleted',
                payload: {
                    eventType: 'connection.deleted',
                    connection,
                },
                channels: [connection.t_id],
            });
            return { status: 'ok', deleted };
        } else {
            return {
                error: 'Connections not found!',
            };
        }
    }

    async createWebhook(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        _res: Response<any, Record<string, any>, number>
    ) {
        try {
            const { 'x-revert-api-token': token, 'x-revert-t-id': tenantId } = req.headers;
            const webhookUrl = req.body.webhookUrl;
            const account = await prisma.accounts.findFirst({
                where: {
                    private_token: String(token),
                },
            });
            const svixAppId = account!.id;
            const secret = `whsec_${Buffer.from(uuidv4()).toString('base64')}`;
            const webhook = await this.svix.endpoint.create(svixAppId, {
                url: webhookUrl,
                version: 1,
                description: `Connection Webhook for tenant ${tenantId}`,
                uid: String(tenantId),
                channels: [String(tenantId)],
                secret: secret,
            });
            return { status: 'ok', webhookUrl: webhook.url, createdAt: webhook.createdAt, secret: secret };
        } catch (error: any) {
            logError(error);
            console.error(error);
            return {
                error: 'Error creating webhook!',
                errorMessage: error,
            };
        }
    }
    async getWebhook(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        _res: Response<any, Record<string, any>, number>
    ) {
        try {
            const { 'x-revert-api-token': token, 'x-revert-t-id': tenantId } = req.headers;
            const account = await prisma.accounts.findFirst({
                where: {
                    private_token: String(token),
                },
            });
            const svixAppId = account!.id;
            const webhook = await this.svix.endpoint.get(svixAppId, String(tenantId));
            return { status: 'ok', webhook: webhook };
        } catch (error: any) {
            logError(error);
            console.error(error);
            return {
                error: 'Error fetching webhook!',
                errorMessage: error,
            };
        }
    }

    async deleteWebhook(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        _res: Response<any, Record<string, any>, number>
    ) {
        try {
            const { 'x-revert-api-token': token, 'x-revert-t-id': tenantId } = req.headers;
            const webhookId = String(tenantId);
            const account = await prisma.accounts.findFirst({
                where: {
                    private_token: String(token),
                },
            });
            const svixAppId = account!.id;
            await this.svix.endpoint.delete(svixAppId, webhookId);
            return { status: 'ok' };
        } catch (error: any) {
            logError(error);
            console.error(error);
            return {
                error: 'Error deleting webhook!',
                errorMessage: error,
            };
        }
    }
}

export default new ConnectionService();
