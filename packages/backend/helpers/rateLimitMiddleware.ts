import { Request, Response } from 'express';
import { RateLimiterRedis, IRateLimiterStoreOptions } from 'rate-limiter-flexible';

import redis from '../redis/client';
import { skipRateLimitRoutes } from './utils';

const rateLimiters = new Map<number, RateLimiterRedis>();

//We can make this dynamic based on the subscription as well
const RATE_LIMIT_DURATION_IN_MINUTES = 1;

const getRateLimiter = (rateLimit: number): RateLimiterRedis => {
    if (!rateLimiters.has(rateLimit)) {
        const opts: IRateLimiterStoreOptions = {
            storeClient: redis,
            /** Dynamic points based on subscription.
             *  Points mean maximum number of requests in the duration
             * */
            points: rateLimit,
            duration: RATE_LIMIT_DURATION_IN_MINUTES * 60, // duration in seconds
        };
        rateLimiters.set(rateLimit, new RateLimiterRedis(opts));
    }
    return rateLimiters.get(rateLimit)!; // the `!` tells TypeScript that the return value is non-null
};

async function rateLimitMiddleware(req: Request, res: Response, next: Function) {
    if (skipRateLimitRoutes(req)) next();
    try {
        const { 'x-revert-t-id': tenantId } = req.headers;
        const { subscription } = res.locals.account;
        const rateLimit = subscription.rate_limit;
        //TODO: Maybe include the x-revert-api-key along with the tenantId to make it more unique
        const rateLimiter = getRateLimiter(rateLimit);
        await rateLimiter.consume(tenantId as string, 1); // consume 1 point for each request
        next();
    } catch (rejRes) {
        if (rejRes instanceof Error) {
            throw rejRes;
        } else {
            res.status(429).send('Too Many Requests');
        }
    }
}

export default rateLimitMiddleware;
