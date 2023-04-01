import axios from 'axios';
import express from 'express';
import config from '../config';
import qs from 'qs';
import AuthService from '../services/auth';
import customerMiddleware from '../helpers/customerIdMiddleware';
import tenantMiddleware from '../helpers/tenantIdMiddleware';
import LeadService from '../services/lead';
import ContactService from '../services/contact';
import CompanyService from '../services/company';
import ProxyService from '../services/proxy';
import prisma from '../prisma/client';

const crmRouter = express.Router();

/**
 * Test PING
 */

crmRouter.get('/ping', async (_, res) => {
    res.send({
        status: 'ok',
        message: 'PONG',
    });
});

/**
 * OAuth API
 */
crmRouter.get('/oauth-callback', async (req, res) => {
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

crmRouter.get('/oauth/refresh', async (_, res) => {
    res.status(200).send(await AuthService.refreshOAuthTokensForThirdParty());
});

/**
 * Leads API
 */

// Get all leads (paginated)
crmRouter.get('/leads', customerMiddleware(), async (req, res) => {
    try {
        const result = await LeadService.getUnifiedLeads(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error) {
        console.error('Could not fetch leads', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// Get a lead object identified by {id}
crmRouter.get('/lead/:id', customerMiddleware(), async (req, res) => {
    try {
        const result = await LeadService.getUnifiedLead(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not fetch lead', error);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Create a lead
crmRouter.post('/lead', tenantMiddleware(), async (req, res) => {
    try {
        const result = await LeadService.createLead(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not create lead', error.response);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Update a lead identified by {id}
crmRouter.patch('/lead/:id', tenantMiddleware(), async (req, res) => {
    try {
        const result = await LeadService.updateLead(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not update lead', error.response);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Search a lead with query.
crmRouter.post('/leads/search', tenantMiddleware(), async (req, res) => {
    try {
        const result = await LeadService.searchUnifiedLeads(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error) {
        console.error('Could not search CRM', error);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

/**
 * Company API
 */

// Get all companies (paginated)
crmRouter.get('/companies', customerMiddleware(), async (req, res) => {
    try {
        const result = await CompanyService.getUnifiedCompanies(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error) {
        console.error('Could not fetch companies', error);
        res.status(500).send({ error: 'Unexpected error. Could not fetch companies' });
    }
});

// Get a company object identified by {id}
crmRouter.get('/company/:id', customerMiddleware(), async (req, res) => {
    try {
        const result = await CompanyService.getUnifiedCompany(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not fetch company', error);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Create a company
crmRouter.post('/company', tenantMiddleware(), async (req, res) => {
    try {
        const result = await CompanyService.createCompany(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not create company', error.response);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Update a company identified by {id}
crmRouter.patch('/company/:id', tenantMiddleware(), async (req, res) => {
    try {
        const result = await CompanyService.updateCompany(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not update company', error.response);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Search a company with query.
crmRouter.post('/companies/search', tenantMiddleware(), async (req, res) => {
    try {
        const result = await CompanyService.searchUnifiedCompanies(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error) {
        console.error('Could not search CRM', error);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

/**
 * Contacts API
 */
// Get all contacts (paginated)
crmRouter.get('/contacts', customerMiddleware(), async (req, res) => {
    try {
        const result = await ContactService.getUnifiedContacts(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error) {
        console.error('Could not fetch contacts', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// Get a contact object identified by {id}
crmRouter.get('/contact/:id', customerMiddleware(), async (req, res) => {
    try {
        const result = await ContactService.getUnifiedContact(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not fetch contact', error);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Create a contact
crmRouter.post('/contact', tenantMiddleware(), async (req, res) => {
    try {
        const result = await ContactService.createContact(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not create contact', error.response);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Update a contact identified by {id}
crmRouter.patch('/contact/:id', tenantMiddleware(), async (req, res) => {
    try {
        const result = await ContactService.updateContact(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not update contact', error.response);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Search a contact with query.
crmRouter.post('/contacts/search', tenantMiddleware(), async (req, res) => {
    try {
        const result = await ContactService.searchUnifiedContacts(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error) {
        console.error('Could not search CRM', error);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

crmRouter.post('/proxy', customerMiddleware(), async (req, res) => {
    try {
        const result = await ProxyService.tunnel(req, res);
        if (result.error) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    } catch (error: any) {
        console.error('Could not execute proxy api', error);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

export default crmRouter;
