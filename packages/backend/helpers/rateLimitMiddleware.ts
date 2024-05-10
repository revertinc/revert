import { Request, Response } from 'express';
import { RateLimiterRedis, IRateLimiterStoreOptions } from 'rate-limiter-flexible';

import redis from '../redis/client';
import { skipRateLimitRoutes } from './utils';

// In Memory Cache for storing RateLimiterRedis instances to prevent the creation of a new instance for each request.
// The cache key is the 'rate_limit' value derived from the subscriptions table. Currently, we cache by the 'rate_limit' value for simplicity.
// Using 'subscriptionId' as a key would be more precise but would add complexity in keeping the cache in sync with the database.
const rateLimiters = new Map<number, RateLimiterRedis>();

//We can make this dynamic based on the subscription as well
const RATE_LIMIT_DURATION_IN_MINUTES = 1;

const getRateLimiter = (rateLimit: number): RateLimiterRedis => {
    if (!rateLimiters.has(rateLimit)) {
        const opts: IRateLimiterStoreOptions = {
            storeClient: redis,
            points: rateLimit, // Points represent the maximum number of requests allowed within the set duration.
            duration: RATE_LIMIT_DURATION_IN_MINUTES * 60, // Converts minutes to seconds for the duration.
        };
        rateLimiters.set(rateLimit, new RateLimiterRedis(opts));
    }
    return rateLimiters.get(rateLimit)!; // the `!` tells TypeScript that the return value is non-null
};

const rateLimitMiddleware = () => async (req: Request, res: Response, next: Function) => {
    if (skipRateLimitRoutes(req)) next();
    try {
        const { 'x-revert-t-id': tenantId } = req.headers;
        const { subscription } = res.locals.account; // Subscription details are retrieved from response locals set earlier in the revertAuthMiddleware.
        const rateLimit = subscription.rate_limit;
        //TODO: Maybe include the x-revert-api-key along with the tenantId to make it more unique
        const rateLimiter = getRateLimiter(rateLimit);
        // rate limit is per tenantId
        await rateLimiter.consume(tenantId as string, 1); // consume 1 point for each request
        next();
    } catch (rejRes) {
        if (rejRes instanceof Error) {
            throw rejRes;
        } else {
            res.status(429).send('Too Many Requests');
        }
    }
};

export default rateLimitMiddleware;
