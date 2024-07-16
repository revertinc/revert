import { AppService } from '../../generated/typescript/api/resources/internal/resources/app/service/AppService';
import prisma from '../../prisma/client';
import redis from '../../redis/client';
import { NotFoundError, UnAuthorizedError } from '../../generated/typescript/api/resources/common';

const appService = new AppService({
    async getRecentApiCallsForApp(req, res) {
        const { 'x-revert-api-token': token, 'x-revert-t-id': tenantId } = req.headers;
        const account = await prisma.accounts.findFirst({
            where: {
                private_token: token as string,
            },
            select: {
                public_token: true,
            },
        });

        if (!account) {
            throw new UnAuthorizedError({
                error: 'Api token unauthorized',
            });
        }

        const connections = await prisma.connections.findFirst({
            where: {
                t_id: tenantId as string,
            },
        });

        if (!connections) {
            throw new NotFoundError({
                error: 'Connection not found',
            });
        }

        if (connections?.appId) {
            const recentApiCalls = await redis.lRange(`recent_routes_app_${connections.appId}`, 0, -1);
            return res.send({
                result: recentApiCalls.map((call) => {
                    const parsed: { method: string; status: number; path: string } = JSON.parse(call);
                    return parsed;
                }),
            });
        }

        res.send({
            result: [],
        });
    },
});

export { appService };
