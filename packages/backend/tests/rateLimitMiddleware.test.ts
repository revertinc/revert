import { Response } from 'express';
import rateLimitMiddleware from '../helpers/rateLimitMiddleware';
import { skipRateLimitRoutes } from '../helpers/utils';
import { jest, describe, expect, it, beforeEach } from '@jest/globals';

type StatusFn = (code: number) => Response;
type SendFn = (body?: any) => Response;

jest.mock('../redis/client', () => {
    return {
        createClient: jest.fn().mockReturnThis(),
        on: jest.fn(),
        connect: jest.fn(),
    };
});
jest.mock('../helpers/utils', () => {
    return {
        skipRateLimitRoutes: jest.fn(),
    };
});
jest.mock('rate-limiter-flexible', () => {
    return {
        RateLimiterRedis: jest.fn().mockImplementation(() => ({
            consume: jest.fn(),
        })),
    };
});
//TODO: some more extensive test case are required
describe('Rate Limit Middleware', () => {
    const mockRequest = (options = {}) => ({
        headers: { 'x-revert-t-id': 'tenant123' },
        ...options,
    });
    const mockResponse = () => {
        const res = {
            locals: { account: { subscription: { rate_limit: 100 }, id: 'account123' } },
        } as unknown as Response;
        res.status = jest.fn().mockReturnValue(res) as unknown as StatusFn;
        res.send = jest.fn().mockReturnValue(res) as unknown as SendFn;
        return res;
    };
    const nextFunction = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call next if route should be skipped', async () => {
        //@ts-ignore
        skipRateLimitRoutes.mockReturnValue(true);
        const req = mockRequest();
        const res = mockResponse();

        //@ts-ignore
        await rateLimitMiddleware()(req, res, nextFunction);

        expect(skipRateLimitRoutes).toHaveBeenCalled();
        expect(nextFunction).toHaveBeenCalled();
    });
});
