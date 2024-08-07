import prisma from '../../prisma/client';
import { AnalyticsService } from '../../generated/typescript/api/resources/internal/resources/analytics/service/AnalyticsService';
import redis from '../../redis/client';
import { isStandardError } from '../../helpers/error';
import { logError } from '../../helpers/logger';
import { InternalServerError } from '../../generated/typescript/api/resources/common';
import AuthService from '../auth';
import { getLastSevenDays } from '../../helpers/timeZoneHelper';

const analyticsService = new AnalyticsService({
    async getAnalytics(req, res) {
        try {
            const userId = req.body.userId;
            const environment = req.body.environment;
            const user = await AuthService.getAccountForUser(userId);
            let token = user.account.environments.find((e: any) => e.env === environment);
            const environmentId = token.id;
            if (token && token.env) token = token.private_token;

            const countConnections = await prisma.connections.aggregate({
                where: {
                    app: {
                        env: {
                            is: {
                                private_token: String(token),
                            },
                        },
                    },
                },
                _count: {
                    id: true,
                },
            });
            const totalConnections = countConnections._count.id;
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

            let connectedApps: any = [];
            connectedApps = connections.map((connection: any) => {
                let appName: any;
                let imageSrc: any;
                if (connection.tp_id === 'hubspot') {
                    imageSrc =
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1688550714/Revert/image_9_1_vilmhw.png';
                }
                if (connection.tp_id === 'zohocrm') {
                    appName = 'Zoho crm';
                    imageSrc =
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1688550788/Revert/image_10_xvb9h7.png';
                } else if (connection.tp_id === 'sfdc') {
                    appName = 'Salesforce';
                    imageSrc =
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1688550774/Revert/image_8_2_peddol.png';
                } else if (connection.tp_id === 'pipedrive') {
                    imageSrc = 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1688633518/Revert/PipedriveLogo.png';
                } else if (connection.tp_id === 'closecrm') {
                    appName = 'Close crm';
                    imageSrc =
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/c_scale,w_136/Revert/o8kv3xqzoqioupz0jpnl.jpg';
                } else if (connection.tp_id === 'slack') {
                    appName = 'Slack chat';
                    imageSrc =
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1697800654/Revert/txfq0qixzprqniuc0wry.png';
                } else if (connection.tp_id === 'discord') {
                    appName = 'Discord chat';
                    imageSrc =
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/c_scale,w_136/v1701337535/Revert/qorqmz5ggxbb5ckywmxm.png';
                } else if (connection.tp_id === 'linear') {
                    appName = 'Linear';
                    imageSrc =
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1702974919/Revert/v5e5z6afm5iepiy3cvex.png';
                } else if (connection.tp_id === 'clickup') {
                    appName = 'Clickup';
                    imageSrc =
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1702974919/Revert/zckjrxorttrrmyuxf1hu.png';
                } else if (connection.tp_id === 'jira') {
                    appName = 'Jira';
                    imageSrc =
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1702983006/Revert/szfzkoagws7h3miptezo.png';
                } else if (connection.tp_id === 'trello') {
                    appName = 'Trello';
                    imageSrc =
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1705315257/Revert/abt6asvtvdqhzgadanwx.png';
                }
                appName = connection.tp_id.charAt(0).toUpperCase() + connection.tp_id.slice(1);
                return {
                    appName,
                    imageSrc,
                };
            });

            let recentConnections: any = await prisma.connections.findMany({
                where: {
                    app: {
                        env: {
                            is: {
                                private_token: String(token),
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 5,
                select: {
                    id: true,
                    createdAt: true,
                },
            });

            recentConnections = recentConnections.map((connection: any) => ({
                id: connection.id,
                createdAt: new Date(connection.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                }),
            }));

            let recentApiCalls: any = await redis.lRange(`recent_routes_${token}`, 0, -1);
            recentApiCalls = recentApiCalls.map((apiCall: any) => JSON.parse(apiCall));
            const totalApiCalls = Number(await redis.get(`request_count_${environmentId}`)) ?? 0;
            const summary = await redis.hGetAll(`summary_api_calls_${environmentId}`);
            const last7days = getLastSevenDays();
            const summaryApiCalls = last7days.map((day) => {
                const numberOfCalls = summary[day];
                if (!numberOfCalls) {
                    return { date: day, numberOfCalls: 0 };
                }

                return {
                    date: day,
                    numberOfCalls: Number(numberOfCalls),
                };
            });

            res.send({
                status: 'ok',
                result: {
                    totalConnections,
                    connectedApps,
                    recentConnections,
                    recentApiCalls,
                    totalApiCalls,
                    summaryApiCalls,
                },
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
