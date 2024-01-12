import { Request, Response } from 'express';
import redis from '../redis/client';

const endpointLogger = async (req: Request, res: Response, next: () => any) => {
    const path = req.path;
    const toAllow = path.startsWith('/v1/crm') || path.startsWith('/v1/chat') || path.startsWith('/v1/ticket');
    if (!toAllow) return next();
    const { 'x-revert-api-token': token } = req.headers;
    const logEntry: any = {
        method: req.method,
        path: path.substring(3),
        status: undefined,
    };

    if (res.headersSent) logEntry.status = res.statusCode;
    const queueLength = await redis.lPush(`recent_routes_${token}`, JSON.stringify(logEntry));
    if (queueLength > 5) await redis.rPop(`recent_routes_${token}`);
    next();
};

export default endpointLogger;
