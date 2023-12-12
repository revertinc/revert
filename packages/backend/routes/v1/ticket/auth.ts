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
import { OAuth } from 'oauth';

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
        const svixAppId = account!.accounts!.id;

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

            logInfo('OAuth creds for Linear', result.data);
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

            logInfo('OAuth token info', info.data);

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
                config.svix?.message.create(svixAppId, {
                    eventType: 'connection.added',
                    payload: {
                        eventType: 'connection.added',
                        connection: {
                            t_id: req.query.t_id as string,
                            tp_id: TP_ID.linear,
                            tp_access_token: result.data.access_token,
                            tp_customer_id: info.data.viewer?.id,
                        },
                    },
                    channels: [req.query.t_id as string],
                });

                await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${req.query.t_id}`, {
                    publicToken: revertPublicKey,
                    status: 'SUCCESS',
                    integrationName: mapIntegrationIdToIntegrationName[integrationId],
                    tenantId: req.query.t_id,
                    tenantSecretToken,
                } as IntegrationStatusSseMessage);
                res.send({ status: 'ok', tp_customer_id: info.data.viewer?.id });
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
        } else if (integrationId === TP_ID.clickup && req.query.code && req.query.t_id && revertPublicKey) {
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

            logInfo('OAuth creds for Clickup', result.data);

            const info = await axios({
                method: 'get',
                url: 'https://api.clickup.com/api/v2/user',
                headers: {
                    Authorization: `${result.data?.token_type} ${result.data.access_token}`,
                },
            });
            logInfo('OAuth token info', info.data);

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
                config.svix?.message.create(svixAppId, {
                    eventType: 'connection.added',
                    payload: {
                        eventType: 'connection.added',
                        connection: {
                            t_id: req.query.t_id as string,
                            tp_id: TP_ID.clickup,
                            tp_access_token: result.data.access_token,
                            tp_customer_id: info.data?.user?.id,
                        },
                    },
                    channels: [req.query.t_id as string],
                });

                await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${req.query.t_id}`, {
                    publicToken: revertPublicKey,
                    status: 'SUCCESS',
                    integrationName: mapIntegrationIdToIntegrationName[integrationId],
                    tenantId: req.query.t_id,
                    tenantSecretToken,
                } as IntegrationStatusSseMessage);

                res.send({ status: 'ok', tp_customer_id: info.data.user.id });
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
        } else if (integrationId === TP_ID.trello && req.query.t_id && revertPublicKey) {
            const requestURL = 'https://trello.com/1/OAuthGetRequestToken';
            const accessURL = 'https://trello.com/1/OAuthGetAccessToken';
            const oauth = new OAuth(
                requestURL,
                accessURL,
                String(clientId),
                String(clientSecret),
                '1.0A',
                null,
                'HMAC-SHA1'
            );
            const token = String(req.query.oauth_token);
            const verifier = String(req.query.oauth_verifier);
            const tokenSecret = await redis.get(`trello_dev_oauth_token_${req.query.oauth_token}`);
            let info: any = {};
            try {
                const { accessToken, accessTokenSecret }: { accessToken: string; accessTokenSecret: string } =
                    await new Promise((resolve, reject) => {
                        oauth.getOAuthAccessToken(
                            token,
                            String(tokenSecret),
                            verifier,
                            (error, accessToken, accessTokenSecret, _results) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve({ accessToken, accessTokenSecret });
                                }
                            }
                        );
                    });
                await redis.setEx(`trello_dev_access_token_secret_${accessToken}`, 3600 * 24 * 10, accessTokenSecret);
                const access_creds: { access_token: string; access_secret: string } = {
                    access_token: accessToken,
                    access_secret: accessTokenSecret,
                };
                logInfo('OAuth creds for Trello', access_creds);
                oauth.getProtectedResource(
                    'https://api.trello.com/1/members/me',
                    'GET',
                    accessToken,
                    accessTokenSecret,
                    (_error, data, _response) => {
                        // @TODO error handling
                        info = data;
                    }
                );
                logInfo('OAuth token info', info);
                await xprisma.connections.upsert({
                    where: {
                        id: String(req.query.t_id),
                    },
                    update: {
                        tp_access_token: String(access_creds.access_token),
                        app_client_id: clientId || config.TRELLO_CLIENT_ID,
                        app_client_secret: clientSecret || config.TRELLO_CLIENT_SECRET,
                    },
                    create: {
                        id: String(req.query.t_id),
                        t_id: req.query.t_id as string,
                        tp_id: integrationId,
                        tp_access_token: String(access_creds.access_token),
                        app_client_id: clientId || config.TRELLO_CLIENT_ID,
                        app_client_secret: clientSecret || config.TRELLO_CLIENT_SECRET,
                        tp_customer_id: String(info.id),
                        owner_account_public_token: revertPublicKey,
                        appId: account?.apps[0].id,
                    },
                });

                config.svix?.message.create(svixAppId, {
                    eventType: 'connection.added',
                    payload: {
                        eventType: 'connection.added',
                        connection: {
                            t_id: req.query.t_id as string,
                            tp_id: TP_ID.trello,
                            tp_access_token: access_creds.access_token,
                            tp_customer_id: info.id,
                        },
                    },
                    channels: [req.query.t_id as string],
                });

                await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${req.query.t_id}`, {
                    publicToken: revertPublicKey,
                    status: 'SUCCESS',
                    integrationName: mapIntegrationIdToIntegrationName[integrationId],
                    tenantId: req.query.t_id,
                    tenantSecretToken,
                } as IntegrationStatusSseMessage);
                res.send({ status: 'ok', tp_customer_id: info.id });
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
        } else if (integrationId === TP_ID.jira && req.query.t_id && req.query.code && revertPublicKey) {
            const formData = {
                grant_type: 'authorization_code',
                client_id: clientId || config.JIRA_CLIENT_ID,
                client_secret: clientSecret || config.JIRA_CLIENT_SECRET,
                code: req.query.code,
                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/jira`,
            };

            const result: any = await axios({
                method: 'post',
                url: 'https://auth.atlassian.com/oauth/token',
                headers: {
                    'Content-Type': 'application/json',
                },
                data: formData,
            });
            const auth = 'Bearer ' + result.data.access_token;
            logInfo('OAuth creds for jira', result.data);

            // fetch the cloud id, required for further requests
            const resources = await axios({
                method: 'get',
                url: 'https://api.atlassian.com/oauth/token/accessible-resources',
                headers: {
                    Accept: 'application/json',
                    Authorization: auth,
                },
            });

            const cloud_id = resources.data[0].id;
            const jiraBaseUrl = `https://api.atlassian.com/ex/jira/${cloud_id}`;

            // fetch user info
            const info = await axios({
                method: 'get',
                url: `${jiraBaseUrl}/rest/api/2/myself`,
                headers: {
                    Accept: 'application/json',
                    Authorization: auth,
                },
            });
            logInfo('User info', info.data);
            const accountId = info.data?.accountId;

            try {
                await xprisma.connections.upsert({
                    where: {
                        id: String(req.query.t_id),
                    },
                    create: {
                        id: String(req.query.t_id),
                        t_id: req.query.t_id as string,
                        tp_id: integrationId,
                        tp_access_token: result.data.access_token,
                        tp_refresh_token: result.data.refresh_token,
                        tp_customer_id: accountId,
                        tp_account_url: jiraBaseUrl as string,
                        app_client_id: clientId || config.JIRA_CLIENT_ID,
                        app_client_secret: clientSecret || config.JIRA_CLIENT_SECRET,
                        owner_account_public_token: revertPublicKey,
                        appId: account?.apps[0].id,
                    },
                    update: {
                        tp_access_token: result.data.access_token,
                        tp_refresh_token: result.data.refresh_token,
                    },
                });

                config.svix?.message.create(svixAppId, {
                    eventType: 'connection.added',
                    payload: {
                        eventType: 'connection.added',
                        connection: {
                            t_id: req.query.t_id as string,
                            tp_id: TP_ID.trello,
                            tp_access_token: result.data.access_token,
                            tp_refresh_token: result.data.refresh_token,
                            tp_customer_id: accountId,
                        },
                    },
                    channels: [req.query.t_id as string],
                });

                await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${req.query.t_id}`, {
                    publicToken: revertPublicKey,
                    status: 'SUCCESS',
                    integrationName: mapIntegrationIdToIntegrationName[integrationId],
                    tenantId: req.query.t_id,
                    tenantSecretToken,
                } as IntegrationStatusSseMessage);
                res.send({ status: 'ok', tp_customer_id: accountId });
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
