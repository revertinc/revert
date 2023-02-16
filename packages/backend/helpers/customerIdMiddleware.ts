import createConnectionPool, { sql } from '@databases/pg';
import { Request, Response } from 'express';
import config from '../config';

const revertCustomerMiddleware = () => async (req: Request, res: Response, next: () => any) => {
    const { 'x-revert-customer-id': customerId } = req.headers;
    const db = createConnectionPool(config.PGSQL_URL);
    try {
        const connection: any = await db.query(
            sql`select tp_access_token, tp_id, t_id from connections where tp_customer_id = ${customerId}` // FIXME: Handle same customer_id across the same tenant
        );
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
    } catch (error) {
    } finally {
        await db.dispose();
    }

    return next();
};

export default revertCustomerMiddleware;
