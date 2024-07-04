import { Request, Response, NextFunction } from 'express';
import redis from '../redis/client';
import { logError } from './logger';
import prisma from '../prisma/client';
// @FIXME Add logic for error
const endpointLogger = () => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const path = req.path;
        const { 'x-revert-api-token': token } = req.headers;
        const toAllow = path.includes('/crm') || path.includes('/chat') || path.includes('/ticket');

        if (!toAllow) return next();

        const logEntry: any = {
            method: req.method,
            path: path,
            status: undefined,
        };

        if (res.headersSent) logEntry.status = res.statusCode;
        const queueLength = await redis.lPush(`recent_routes_${token}`, JSON.stringify(logEntry));
        if (queueLength && queueLength > 5) await redis.rPop(`recent_routes_${token}`);

        const environment = await prisma.environments.findFirst({
            where: {
                private_token: String(token),
            },
        });

        if (!environment) {
            throw new Error("Account doesn't exist");
        }
        await redis.INCR(`request_count_${environment.id}`);
        next();
    } catch (error: any) {
        logError(error);
        console.error('Error in endpointLogger middleware: ', error);
        next(error);
    }
};

export default endpointLogger;
