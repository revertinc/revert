import axios from 'axios';
import express from 'express';
import config from '../../../config';
import qs from 'qs';
import { TP_ID } from '@prisma/client';
import AuthService from '../../../services/auth';
import prisma, { Prisma, xprisma } from '../../../prisma/client';
import { logInfo, logError } from '../../../helpers/logger';

const authRouter = express.Router({ mergeParams: true });

/**
 * OAuth API
 */
authRouter.get('/oauth-callback', async (req, res) => {
    logInfo('OAuth callback', req.query);
    const integrationId = req.query.integrationId as TP_ID;
    const revertPublicKey = req.query.x_revert_public_token as string;
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
        if (integrationId === TP_ID.hubspot && req.query.code && req.query.t_id && revertPublicKey) {
            // Handle the received code
            const url = 'https://api.hubapi.com/oauth/v1/token';
            const formData = {
                grant_type: 'authorization_code',
                client_id: clientId || config.HUBSPOT_CLIENT_ID,
                client_secret: clientSecret || config.HUBSPOT_CLIENT_SECRET,
                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/hubspot`,
                code: req.query.code,
            };
            const result = await axios({
                method: 'post',
                url: url,
                data: qs.stringify(formData),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                },
            });
            logInfo('OAuth creds for hubspot', result.data);
            const info = await axios({
                method: 'get',
                url: 'https://api.hubapi.com/oauth/v1/access-tokens/' + result.data.access_token,
            });
            logInfo('Oauth token info', info.data);
            try {
                await xprisma.connections.upsert({
                    where: {
                        id: String(req.query.t_id),
                    },
                    update: {
                        tp_access_token: result.data.access_token,
                        tp_refresh_token: result.data.refresh_token,
                        app_client_id: clientId || config.HUBSPOT_CLIENT_ID,
                        app_client_secret: clientSecret || config.HUBSPOT_CLIENT_SECRET,
                    },
                    create: {
                        id: String(req.query.t_id),
                        t_id: req.query.t_id as string,
                        tp_id: integrationId,
                        tp_access_token: result.data.access_token,
                        tp_refresh_token: result.data.refresh_token,
                        app_client_id: clientId || config.HUBSPOT_CLIENT_ID,
                        app_client_secret: clientSecret || config.HUBSPOT_CLIENT_SECRET, // TODO: Fix in other platforms.
                        tp_customer_id: info.data.user,
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
                            tp_id: TP_ID.hubspot,
                            tp_access_token: result.data.access_token,
                            tp_customer_id: info.data.user,
                        },
                    },
                    channels: [req.query.t_id as string],
                });
                res.send({ status: 'ok', tp_customer_id: info.data.user });
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
                res.send({ status: 'error', error: error });
            }
        } else if (integrationId === TP_ID.zohocrm && req.query.code && req.query.accountURL) {
            // Handle the received code
            const url = `${req.query.accountURL}/oauth/v2/token`;
            const formData = {
                grant_type: 'authorization_code',
                client_id: clientId || config.ZOHOCRM_CLIENT_ID,
                client_secret: clientSecret || config.ZOHOCRM_CLIENT_SECRET,
                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/zohocrm`,
                code: req.query.code,
            };
            logInfo('Zoho', req.query, formData);
            const result = await axios({
                method: 'post',
                url: url,
                data: qs.stringify(formData),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                },
            });
            logInfo('OAuth creds for zohocrm', result.data);
            if (result.data.error) {
                res.send({ status: 'error', error: result.data.error });
                return;
            } else {
                const info = await axios({
                    method: 'get',
                    url: 'https://accounts.zoho.com/oauth/user/info',
                    headers: {
                        authorization: `Zoho-oauthtoken ${result.data.access_token}`,
                    },
                });
                logInfo('Oauth token info', info.data);
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
                            tp_customer_id: info.data.Email,
                            tp_account_url: req.query.accountURL as string,
                            app_client_id: clientId || config.ZOHOCRM_CLIENT_ID,
                            app_client_secret: clientSecret || config.ZOHOCRM_CLIENT_SECRET,
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
                                tp_id: TP_ID.zohocrm,
                                tp_access_token: result.data.access_token,
                                tp_customer_id: info.data.Email,
                                tp_account_url: req.query.accountURL as string,
                            },
                        },
                        channels: [req.query.t_id as string],
                    });
                    res.send({ status: 'ok' });
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
                    res.send({ status: 'error', error: error });
                }
            }
        } else if (integrationId === TP_ID.sfdc && req.query.code && req.query.t_id) {
            // Handle the received code
            const url = 'https://login.salesforce.com/services/oauth2/token';
            const formData = {
                grant_type: 'authorization_code',
                client_id: clientId || config.SFDC_CLIENT_ID,
                client_secret: clientSecret || config.SFDC_CLIENT_SECRET,
                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/sfdc`,
                code: req.query.code,
            };
            const result = await axios({
                method: 'post',
                url: url,
                data: qs.stringify(formData),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                },
            });
            logInfo('OAuth creds for sfdc', result.data);
            const info = await axios({
                method: 'get',
                url: 'https://login.salesforce.com/services/oauth2/userinfo',
                headers: {
                    authorization: `Bearer ${result.data.access_token}`,
                },
            });
            logInfo('Oauth token info', info.data);
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
                        tp_customer_id: info.data.email,
                        tp_account_url: info.data.urls['custom_domain'],
                        app_client_id: clientId || config.SFDC_CLIENT_ID,
                        app_client_secret: clientSecret || config.SFDC_CLIENT_SECRET,
                        owner_account_public_token: revertPublicKey,
                        appId: account?.apps[0].id,
                    },
                    update: {
                        tp_access_token: result.data.access_token,
                        tp_refresh_token: result.data.refresh_token,
                        app_client_id: clientId || config.SFDC_CLIENT_ID,
                        app_client_secret: clientSecret || config.SFDC_CLIENT_SECRET,
                    },
                });
                config.svix?.message.create(svixAppId, {
                    eventType: 'connection.added',
                    payload: {
                        eventType: 'connection.added',
                        connection: {
                            t_id: req.query.t_id as string,
                            tp_id: TP_ID.sfdc,
                            tp_access_token: result.data.access_token,
                            tp_customer_id: info.data.email,
                            tp_account_url: info.data.urls['custom_domain'],
                        },
                    },
                    channels: [req.query.t_id as string],
                });
                res.send({ status: 'ok', tp_customer_id: 'testSfdcUser' });
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
                res.send({ status: 'error', error: error });
            }
        } else if (integrationId === TP_ID.pipedrive && req.query.code && req.query.t_id && revertPublicKey) {
            // Handle the received code
            const url = 'https://oauth.pipedrive.com/oauth/token';
            const formData = {
                grant_type: 'authorization_code',
                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/pipedrive`,
                code: req.query.code,
            };
            // TODO: Add proper types
            const result = await axios({
                method: 'post',
                url: url,
                data: qs.stringify(formData),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                    Authorization: `Basic ${Buffer.from(
                        `${clientId || config.PIPEDRIVE_CLIENT_ID}:${clientSecret || config.PIPEDRIVE_CLIENT_SECRET}`
                    ).toString('base64')}`,
                },
            });
            logInfo('OAuth creds for pipedrive', result.data);
            const info = await axios({
                method: 'get',
                url: `${result.data.api_domain}/users/me`,
                headers: {
                    Authorization: `Bearer ${result.data.access_token}`,
                },
            });
            logInfo('Oauth token info', info.data);
            try {
                await xprisma.connections.upsert({
                    where: {
                        id: String(req.query.t_id),
                    },
                    update: {
                        tp_access_token: result.data.access_token,
                        tp_refresh_token: result.data.refresh_token,
                    },
                    create: {
                        id: String(req.query.t_id),
                        t_id: req.query.t_id as string,
                        tp_id: integrationId,
                        tp_access_token: result.data.access_token,
                        tp_refresh_token: result.data.refresh_token,
                        tp_customer_id: info.data.data.email,
                        owner_account_public_token: revertPublicKey,
                        tp_account_url: result.data.api_domain,
                        appId: account?.apps[0].id,
                    },
                });
                config.svix?.message.create(svixAppId, {
                    eventType: 'connection.added',
                    payload: {
                        eventType: 'connection.added',
                        connection: {
                            t_id: req.query.t_id as string,
                            tp_id: integrationId,
                            tp_access_token: result.data.access_token,
                            tp_customer_id: info.data.data.email,
                        },
                    },
                    channels: [req.query.t_id as string],
                });
                res.send({ status: 'ok', tp_customer_id: info.data.data.email });
            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    if (error?.code === 'P2002') {
                        console.error(
                            'There is a unique constraint violation, a new user cannot be created with this email'
                        );
                    }
                }
                console.error('Could not update db', error);
                res.send({ status: 'error', error: error });
            }
        } else {
            res.send({
                status: 'noop',
            });
        }
    } catch (error: any) {
        logError(error);
        logInfo('Error while getting oauth creds', error);
    }
});

authRouter.get('/oauth/refresh', async (_, res) => {
    res.status(200).send(await AuthService.refreshOAuthTokensForThirdParty());
});
export default authRouter;
