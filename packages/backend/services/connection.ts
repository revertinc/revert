import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import prisma from '../prisma/client';

class ConnectionService {
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
                account: {
                    is: {
                        private_token: String(token),
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
        _req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
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
            return { status: 'ok', deleted };
        } else {
            return {
                error: 'Connections not found!',
            };
        }
    }
}

export default new ConnectionService();
