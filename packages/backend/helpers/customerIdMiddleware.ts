import { Request, Response } from 'express';
import prisma from '../prisma/client';

const revertCustomerMiddleware = () => async (req: Request, res: Response, next: () => any) => {
    const { 'x-revert-customer-id': customerId, 'x-revert-private-token': revertPrivateToken } = req.headers;
    try {
        const connection = await prisma.connections.findMany({
            where: {
                tp_customer_id: customerId as string,
                account: {
                    x_revert_private_token: revertPrivateToken as string,
                },
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
            return next();
        } else {
            return res.status(400).send({
                error: 'Customer not found',
            });
        }
    } catch (error) {
        console.log('error', error);
        return res.status(400).send({
            error: 'Bad request',
        });
    }
};

export default revertCustomerMiddleware;
