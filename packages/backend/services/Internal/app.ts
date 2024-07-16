import { AppService } from '../../generated/typescript/api/resources/internal/resources/app/service/AppService';
import prisma from '../../prisma/client';
import redis from '../../redis/client';
import { UnAuthorizedError } from '../../generated/typescript/api/resources/common';

const appService = new AppService({
    async getRecentApiCallsForApp(req, res) {
        const { appId } = req.params;
        const { 'x-revert-api-token': token } = req.headers;
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
                appId,
            },
        });

        if (!connections) {
            return res.send({ result: undefined });
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
