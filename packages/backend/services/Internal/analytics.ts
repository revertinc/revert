import prisma from '../../prisma/client';
import { AnalyticsService } from '../../generated/typescript/api/resources/internal/resources/analytics/service/AnalyticsService';
import redis from '../../redis/client';
import { isStandardError } from '../../helpers/error';
import { logError } from '../../helpers/logger';
import { InternalServerError } from '../../generated/typescript/api/resources/common';

const analyticsService = new AnalyticsService({
    async getAnalytics(req, res) {
        try {
            const { 'x-revert-api-token': token } = req.headers;

            const connections = await prisma.connections.findMany({
                where: {
                    app: {
                        env: {
                            is: {
                                private_token: String(token),
                            },
                        },
                    },
                },
                select: {
                    tp_id: true,
                },
                distinct: ['tp_id'],
            });

            const totalConnections = connections.length;
            if (connections.length === 0) {
                throw new Error('No connections found');
            }
            let connectedApps = [];
            connectedApps = connections.map((connection: any) => {
                let appName: any;
                let imageSrc: any;
                if (connection.tp_id === 'hubspot') {
                    imageSrc =
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1691139212/Revert/image_57_krrplr.png';
                }
                if (connection.tp_id === 'zohocrm') {
                    appName = 'Zoho crm';
                    imageSrc =
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1691139213/Revert/image_62_bzxn4z.png';
                } else if (connection.tp_id === 'sfdc') {
                    appName = 'Salesforce';
                    imageSrc =
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1691139212/Revert/image_61_svyhd9.png';
                } else if (connection.tp_id === 'pipedrive') {
                    imageSrc = 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1691141825/Revert/pngegg_mhbvfc.png';
                } else if (connection.tp_id === 'closecrm') {
                    appName = 'Close crm';
                    imageSrc =
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/c_scale,w_136/Revert/o8kv3xqzoqioupz0jpnl.jpg';
                } else if (connection.tp_id === 'slack') {
                    appName = 'Slack chat';
                    imageSrc =
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1697800999/Revert/sr7ikiijgzsmednoeil0.png';
                } else if (connection.tp_id === 'discord') {
                    appName = 'Discord chat';
                    imageSrc =
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/c_scale,w_136/v1701337535/Revert/qorqmz5ggxbb5ckywmxm.png';
                }
                appName = connection.tp_id.charAt(0).toUpperCase() + connection.tp_id.slice(1);
                return {
                    appName,
                    imageSrc,
                };
            });

            const recentConnections = await prisma.connections.findMany({
                orderBy: {
                    createdAt: 'desc',
                },
                take: 5,
                select: {
                    id: true,
                    createdAt: true,
                },
            });

            let recentApiCalls = await redis.lRange(`recent_routes_${token}`, 0, -1);
            recentApiCalls = recentApiCalls.map((apiCall: any) => JSON.parse(apiCall));
            res.send({
                status: 'ok',
                result: { totalConnections, connectedApps, recentConnections, recentApiCalls },
            });
        } catch (error: any) {
            logError(error);
            console.error('Could not fetch lead', error);
            if (isStandardError(error)) {
                throw error;
            }
            throw new InternalServerError({ error: 'Internal server error' });
        }
    },
});

export { analyticsService };
