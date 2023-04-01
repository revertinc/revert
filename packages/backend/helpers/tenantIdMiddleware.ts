import { Request, Response } from 'express';
import prisma from '../prisma/client';

const revertTenantMiddleware = () => async (req: Request, res: Response, next: () => any) => {
    const { 'x-revert-t-id': tenantId } = req.headers;
    try {
        const connection: any = await prisma.connections.findMany({
            where: {
                t_id: tenantId as string,
            },
            select: {
                tp_access_token: true,
                tp_id: true,
                t_id: true,
            },
        });

        if (!connection || !connection.length) {
            return res.status(400).send({
                error: 'Tenant not found',
            });
        }
        if (connection[0]) {
            res.locals.connection = connection[0];
        } else {
            return res.status(400).send({
                error: 'Tenant not found',
            });
        }
    } catch (error) {}

    return next();
};

export default revertTenantMiddleware;
