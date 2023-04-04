import axios from 'axios';
import express from 'express';
import config from '../../config';
import qs from 'qs';
import AuthService from '../../services/auth';
import prisma from '../../prisma/client';

const authRouter = express.Router({ mergeParams: true });

/**
 * OAuth API
 */
authRouter.get('/oauth-callback', async (req, res) => {
    console.log('OAuth callback', req.query);
    const integrationId = req.query.integrationId;

    try {
        if (integrationId === 'hubspot' && req.query.code && req.query.t_id) {
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
                        tp_customer_id_tp_id: {
                            tp_customer_id: info.data.user,
                            tp_id: 'hubspot',
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
                    },
                });
                res.send({ status: 'ok', tp_customer_id: info.data.user });
            } catch (error) {
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
                            tp_customer_id_tp_id: {
                                tp_customer_id: info.data.Email,
                                tp_id: 'zohocrm',
                            },
                        },
                        create: {
                            t_id: req.query.t_id as string,
                            tp_id: 'zohocrm',
                            tp_access_token: result.data.access_token,
                            tp_refresh_token: result.data.refresh_token,
                            tp_customer_id: info.data.Email,
                            tp_account_url: req.query.accountURL as string,
                        },
                        update: {
                            tp_access_token: result.data.access_token,
                            tp_refresh_token: result.data.refresh_token,
                        },
                    });
                    res.send({ status: 'ok' });
                } catch (error) {
                    console.error('Could not update db', error);
                    res.send({ status: 'error', error: error });
                }
            }
        } else if (integrationId === 'sfdc' && req.query.code && req.query.t_id) {
            // Handle the received code
            const url = 'https://revert2-dev-ed.develop.my.salesforce.com/services/oauth2/token';
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
                        tp_customer_id_tp_id: {
                            tp_customer_id: info.data.email,
                            tp_id: 'sfdc',
                        },
                    },
                    create: {
                        t_id: req.query.t_id as string,
                        tp_id: 'sfdc',
                        tp_access_token: result.data.access_token,
                        tp_refresh_token: result.data.refresh_token,
                        tp_customer_id: info.data.email,
                    },
                    update: {
                        tp_access_token: result.data.access_token,
                        tp_refresh_token: result.data.refresh_token,
                    },
                });
                res.send({ status: 'ok', tp_customer_id: 'testSfdcUser' });
            } catch (error) {
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
