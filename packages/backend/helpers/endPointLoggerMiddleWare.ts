import { Request, Response, NextFunction } from 'express';
import redis from '../redis/client';
import { logError } from './logger';
// @FIXME Add logic for error
const endpointLogger = () => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const path = req.path;
        const { 'x-revert-api-token': token } = req.headers;
        const toAllow = path.includes('/crm') || path.includes('/chat') || path.includes('/ticket');
        console.log('DEBUG', 'path check... ', path.includes('/crm'), path);
        if (!toAllow) return next();

        const logEntry: any = {
            method: req.method,
            path: path,
            status: undefined,
        };

        if (res.headersSent) logEntry.status = res.statusCode;
        const queueLength = await redis.lPush(`recent_routes_${token}`, JSON.stringify(logEntry));
        if (queueLength && queueLength > 5) await redis.rPop(`recent_routes_${token}`);

        next();
    } catch (error: any) {
        logError(error);
        console.error('Error in endpointLogger middleware: ', error);
        next(error);
    }
};

export default endpointLogger;
