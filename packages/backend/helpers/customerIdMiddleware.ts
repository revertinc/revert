import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const revertCustomerMiddleware = () => async (req: Request, res: Response, next: () => any) => {
    const { 'x-revert-customer-id': customerId } = req.headers;
    try {
        const connection = await prisma.connections.findMany({
            where: {
                tp_customer_id: customerId as string,
            },
            select: {
                tp_access_token: true,
                tp_id: true,
                t_id: true,
            },
        });
        if (!connection || !connection.length) {
            return res.status(400).send({
                error: 'Customer not found',
            });
        }
        if (connection[0]) {
            res.locals.connection = connection[0];
        } else {
            return res.status(400).send({
                error: 'Customer not found',
            });
        }
    } catch (error) {}

    return next();
};

export default revertCustomerMiddleware;
