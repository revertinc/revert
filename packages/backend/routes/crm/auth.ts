import axios from 'axios';
import express from 'express';
import config from '../../config';
import qs from 'qs';
import AuthService from '../../services/auth';
import prisma, { Prisma } from '../../prisma/client';

const authRouter = express.Router({ mergeParams: true });

/**
 * OAuth API
 */
authRouter.get('/oauth-callback', async (req, res) => {
    console.log('OAuth callback', req.query);
    const integrationId = req.query.integrationId;
    const revertPublicKey = req.query.x_revert_public_token as string;
    try {
        if (integrationId === 'hubspot' && req.query.code && req.query.t_id && revertPublicKey) {
            // Handle the received code
            const url = 'https://api.hubapi.com/oauth/v1/token';
            const formData = {
                grant_type: 'authorization_code',
                client_id: config.HUBSPOT_CLIENT_ID,
                client_secret: config.HUBSPOT_CLIENT_SECRET,
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
            console.log('OAuth creds for hubspot', result.data);
            const info = await axios({
                method: 'get',
                url: 'https://api.hubapi.com/oauth/v1/access-tokens/' + result.data.access_token,
            });
            console.log('Oauth token info', info.data);
            try {
                await prisma.connections.upsert({
                    where: {
                        uniqueCustomerPerTenantPerThirdParty: {
                            tp_customer_id: info.data.user,
                            t_id: String(req.query.t_id),
                            tp_id: integrationId,
                        },
                    },
                    update: {
                        tp_access_token: result.data.access_token,
                        tp_refresh_token: result.data.refresh_token,
                    },
                    create: {
                        t_id: req.query.t_id as string,
                        tp_id: 'hubspot',
                        tp_access_token: result.data.access_token,
                        tp_refresh_token: result.data.refresh_token,
                        tp_customer_id: info.data.user,
                        account: {
                            connect: { public_token: revertPublicKey },
                        },
                    },
                });
                res.send({ status: 'ok', tp_customer_id: info.data.user });
            } catch (error) {
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
        } else if (integrationId === 'zohocrm' && req.query.code && req.query.accountURL) {
            // Handle the received code
            const url = `${req.query.accountURL}/oauth/v2/token`;
            const formData = {
                grant_type: 'authorization_code',
                client_id: config.ZOHOCRM_CLIENT_ID,
                client_secret: config.ZOHOCRM_CLIENT_SECRET,
                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/zohocrm`,
                code: req.query.code,
            };
            console.log('Zoho', req.query, formData);
            const result = await axios({
                method: 'post',
                url: url,
                data: qs.stringify(formData),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                },
            });
            console.log('OAuth creds for zohocrm', result.data);
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
                console.log('Oauth token info', info.data);
                try {
                    await prisma.connections.upsert({
                        where: {
                            uniqueCustomerPerTenantPerThirdParty: {
                                tp_customer_id: info.data.Email,
                                t_id: String(req.query.t_id),
                                tp_id: integrationId,
                            },
                        },
                        create: {
                            t_id: req.query.t_id as string,
                            tp_id: 'zohocrm',
                            tp_access_token: result.data.access_token,
                            tp_refresh_token: result.data.refresh_token,
                            tp_customer_id: info.data.Email,
                            tp_account_url: req.query.accountURL as string,
                            account: {
                                connect: { public_token: revertPublicKey },
                            },
                        },
                        update: {
                            tp_access_token: result.data.access_token,
                            tp_refresh_token: result.data.refresh_token,
                        },
                    });
                    res.send({ status: 'ok' });
                } catch (error: any) {
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
        } else if (integrationId === 'sfdc' && req.query.code && req.query.t_id) {
            // Handle the received code
            const url = 'https://login.salesforce.com/services/oauth2/token';
            const formData = {
                grant_type: 'authorization_code',
                client_id: config.SFDC_CLIENT_ID,
                client_secret: config.SFDC_CLIENT_SECRET,
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
            console.log('OAuth creds for sfdc', result.data);
            const info = await axios({
                method: 'get',
                url: 'https://login.salesforce.com/services/oauth2/userinfo',
                headers: {
                    authorization: `Bearer ${result.data.access_token}`,
                },
            });
            console.log('Oauth token info', info.data);
            try {
                await prisma.connections.upsert({
                    where: {
                        uniqueCustomerPerTenantPerThirdParty: {
                            tp_customer_id: info.data.email,
                            t_id: String(req.query.t_id),
                            tp_id: integrationId,
                        },
                    },
                    create: {
                        t_id: req.query.t_id as string,
                        tp_id: 'sfdc',
                        tp_access_token: result.data.access_token,
                        tp_refresh_token: result.data.refresh_token,
                        tp_customer_id: info.data.email,
                        account: {
                            connect: { public_token: revertPublicKey },
                        },
                    },
                    update: {
                        tp_access_token: result.data.access_token,
                        tp_refresh_token: result.data.refresh_token,
                    },
                });
                res.send({ status: 'ok', tp_customer_id: 'testSfdcUser' });
            } catch (error) {
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
        } else {
            res.send({
                status: 'noop',
            });
        }
    } catch (error) {
        console.log('Error while getting oauth creds', error);
    }
});

authRouter.get('/oauth/refresh', async (_, res) => {
    res.status(200).send(await AuthService.refreshOAuthTokensForThirdParty());
});
export default authRouter;
