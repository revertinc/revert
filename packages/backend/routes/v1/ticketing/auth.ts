import express from 'express';
import { randomUUID } from 'crypto';
import { logError, logInfo } from '../../../helpers/logger';
import { mapIntegrationIdToIntegrationName } from '../../../constants/common';
import redis from '../../../redis/client';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../../redis/client/pubsub';
import { Prisma, TP_ID } from '@prisma/client';
import prisma, { xprisma } from '../../../prisma/client';
import config from '../../../config';
import axios from 'axios';
import qs from 'qs';

const authRouter = express.Router();

authRouter.get('/oauth-callback', async (req, res) => {
    logInfo('OAuth callback', req.query);
    const integrationId = req.query.integrationId as TP_ID;
    const revertPublicKey = req.query.x_revert_public_token as string;
    // generate a token for connection auth and save in redis for 5 mins
    const tenantSecretToken = randomUUID();
    await redis.setEx(`tenantSecretToken_${req.query.t_id}`, 5 * 60, tenantSecretToken);

    try {
        const account = await prisma.environments.findFirst({
            where: {
                public_token: String(revertPublicKey),
            },
            include: {
                apps: {
                    select: { id: true, app_client_id: true, app_client_secret: true, is_revert_app: true },
                    where: { tp_id: integrationId },
                },
                accounts: true,
            },
        });

        const clientId = account?.apps[0]?.is_revert_app ? undefined : account?.apps[0]?.app_client_id;
        const clientSecret = account?.apps[0]?.is_revert_app ? undefined : account?.apps[0]?.app_client_secret;
        // const svixAppId = account!.accounts!.id;

        if (integrationId === TP_ID.linear && req.query.code && req.query.t_id && revertPublicKey) {
            // Handle the received code
            const url = `https://api.linear.app/oauth/token`;
            const formData = {
                grant_type: 'authorization_code',
                client_id: clientId || config.LINEAR_CLIENT_ID,
                client_secret: clientSecret || config.LINEAR_CLIENT_SECRET,
                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/linear`,
                code: req.query.code,
            };

            const result = await axios({
                method: 'post',
                url: url,
                data: qs.stringify(formData),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            console.log('DEBUG', 'OAuth creds for Linear', result.data);
            const query = `query Me {
                viewer {
                  id
                  name
                  email
                }
              }`;

            const info = await axios({
                method: 'post',
                url: 'https://api.linear.app/graphql',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `${result.data.token_type} ${result.data.access_token}`,
                },
                data: JSON.stringify({ query: query }),
            });

            console.log('DEBUG', 'Linear User info', info.data);

            try {
                await xprisma.connections.upsert({
                    where: {
                        id: String(req.query.t_id),
                    },
                    update: {
                        tp_access_token: result.data?.access_token,
                        app_client_id: clientId || config.LINEAR_CLIENT_ID,
                        app_client_secret: clientSecret || config.LINEAR_CLIENT_SECRET,
                    },
                    create: {
                        id: String(req.query.t_id),
                        t_id: req.query.t_id as string,
                        tp_id: integrationId,
                        tp_access_token: String(result.data?.access_token),
                        app_client_id: clientId || config.LINEAR_CLIENT_ID,
                        app_client_secret: clientSecret || config.LINEAR_CLIENT_SECRET,
                        tp_customer_id: String(info.data.viewer?.id),
                        owner_account_public_token: revertPublicKey,
                        appId: account?.apps[0].id,
                    },
                });

                // svix stuff here

                await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${req.query.t_id}`, {
                    publicToken: revertPublicKey,
                    status: 'SUCCESS',
                    integrationName: mapIntegrationIdToIntegrationName[integrationId],
                    tenantId: req.query.t_id,
                    tenantSecretToken,
                } as IntegrationStatusSseMessage);
            } catch (error: any) {
                logError(error);
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    // The .code property can be accessed in a type-safe manner
                    if (error?.code === 'P2002') {
                        console.error(
                            'There is a unique constraint violation, a new user cannot be created with this email'
                        );
                    }
                }
                console.error('Could not update db', error);
                await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${req.query.t_id}`, {
                    publicToken: revertPublicKey,
                    status: 'FAILED',
                    integrationName: mapIntegrationIdToIntegrationName[integrationId],
                    tenantId: req.query.t_id,
                    tenantSecretToken,
                } as IntegrationStatusSseMessage);
                res.send({ status: 'error', error: error });
            }

            res.send({ status: 'ok', tp_customer_id: info.data.viewer?.id });
        }
        if (integrationId === TP_ID.clickup && req.query.code && req.query.t_id && revertPublicKey) {
            const formData = {
                client_id: clientId || config.CLICKUP_CLIENT_ID,
                client_secret: clientSecret || config.CLICKUP_CLIENT_SECRET,
                code: req.query.code,
            };

            const result = await axios({
                method: 'post',
                url: 'https://api.clickup.com/api/v2/oauth/token',
                data: qs.stringify(formData),
            });

            console.log('DEBUG', 'result of clickup...', result.data);

            const info = await axios({
                method: 'get',
                url: 'https://api.clickup.com/api/v2/user',
                headers: {
                    Authorization: `${result.data?.token_type} ${result.data.access_token}`,
                },
            });
            console.log('DEBUG', 'user info clickup...', info.data);

            try {
                await xprisma.connections.upsert({
                    where: {
                        id: String(req.query.t_id),
                    },
                    update: {
                        tp_access_token: result.data?.access_token,
                        app_client_id: clientId || config.CLICKUP_CLIENT_ID,
                        app_client_secret: clientSecret || config.CLICKUP_CLIENT_SECRET,
                    },
                    create: {
                        id: String(req.query.t_id),
                        t_id: req.query.t_id as string,
                        tp_id: integrationId,
                        tp_access_token: String(result.data?.access_token),
                        app_client_id: clientId || config.CLICKUP_CLIENT_ID,
                        app_client_secret: clientSecret || config.CLICKUP_CLIENT_SECRET,
                        tp_customer_id: String(info.data?.user?.id),
                        owner_account_public_token: revertPublicKey,
                        appId: account?.apps[0].id,
                    },
                });

                // svix stuff here

                await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${req.query.t_id}`, {
                    publicToken: revertPublicKey,
                    status: 'SUCCESS',
                    integrationName: mapIntegrationIdToIntegrationName[integrationId],
                    tenantId: req.query.t_id,
                    tenantSecretToken,
                } as IntegrationStatusSseMessage);
            } catch (error: any) {
                logError(error);
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    // The .code property can be accessed in a type-safe manner
                    if (error?.code === 'P2002') {
                        console.error(
                            'There is a unique constraint violation, a new user cannot be created with this email'
                        );
                    }
                }
                console.error('Could not update db', error);
                await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${req.query.t_id}`, {
                    publicToken: revertPublicKey,
                    status: 'FAILED',
                    integrationName: mapIntegrationIdToIntegrationName[integrationId],
                    tenantId: req.query.t_id,
                    tenantSecretToken,
                } as IntegrationStatusSseMessage);
                res.send({ status: 'error', error: error });
            }

            res.send({ status: 'ok', tp_customer_id: info.data.user.id });
        } else {
            await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${req.query.t_id}`, {
                publicToken: revertPublicKey,
                status: 'FAILED',
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tenantId: req.query.t_id,
                tenantSecretToken,
            } as IntegrationStatusSseMessage);
            res.send({
                status: 'noop',
            });
        }
    } catch (error: any) {
        logError(error);
        logInfo('Error while getting oauth creds', error);
        await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${req.query.t_id}`, {
            publicToken: revertPublicKey,
            status: 'FAILED',
            integrationName: mapIntegrationIdToIntegrationName[integrationId],
            tenantId: req.query.t_id,
            tenantSecretToken,
        } as IntegrationStatusSseMessage);
        res.send({ status: 'error', error: error });
    }
});

export default authRouter;
