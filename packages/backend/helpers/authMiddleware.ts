import createConnectionPool, { sql } from '@databases/pg';
import { Request, Response } from 'express';
import config from '../config';

const revertAuthMiddleware = () => async (req: Request, res: Response, next: () => any) => {
    const nonSecurePaths = ['/oauth-callback', '/oauth/refresh'];
    if (nonSecurePaths.includes(req.path)) return next();
    const { 'x-revert-token': token } = req.headers;

    if (!token) {
        res.status(401).send({
            error: 'Api token unauthorized',
        });
        return;
    }
    const db = createConnectionPool(config.PGSQL_URL);
    try {
        const account = await db.query(sql`select * from accounts where token = ${token}`);
        if (!account || !account.length) {
            return res.status(401).send({
                error: 'Api token unauthorized',
            });
        }
        return next();
    } catch (error) {
        console.log('error', error);
        return res.status(400).send({
            error: 'Bad request',
        });
    } finally {
        await db.dispose();
    }
};

export default revertAuthMiddleware;
