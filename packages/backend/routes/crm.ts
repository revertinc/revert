import axios from 'axios';
import express from 'express';
import config from '../config';
import qs from 'qs';
import createConnectionPool, { sql } from '@databases/pg';
import AuthService from '../services/auth';
import customerMiddleware from '../helpers/customerIdMiddleware';
import tenantMiddleware from '../helpers/tenantIdMiddleware';

const crmRouter = express.Router();

const filterLeadsFromContactsForHubspot = (leads: any[]) => {
    const updatedLeads = leads
        .flatMap((l) => l)
        .filter((lead) => lead.properties?.hs_lead_status === null || lead.properties?.hs_lead_status === undefined);
    console.log('Filtered Hubspot leads', updatedLeads);
    return updatedLeads;
};

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
// FIXME: Fix Zoho bug with same email id.
crmRouter.get('/oauth-callback', async (req, res) => {
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
            const db = createConnectionPool(config.PGSQL_URL);
            try {
                await db.query(sql`
            INSERT INTO connections (
               t_id, tp_id, tp_access_token, tp_refresh_token, tp_customer_id
            ) VALUES (${req.query.t_id},'hubspot', ${result.data.access_token}, ${result.data.refresh_token}, ${info.data.user})
            ON CONFLICT (tp_customer_id, tp_id)
            DO UPDATE SET
                tp_access_token = EXCLUDED.tp_access_token, 
                tp_refresh_token = EXCLUDED.tp_refresh_token
        `);
                res.send({ status: 'ok', tp_customer_id: info.data.user });
            } catch (error) {
                console.error('Could not update db', error);
                res.send({ status: 'error', error: error });
            } finally {
                await db.dispose();
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
                const db = createConnectionPool(config.PGSQL_URL);
                try {
                    await db.query(sql`
            INSERT INTO connections (
               t_id, tp_id, tp_access_token, tp_refresh_token, tp_customer_id, tp_account_url
            ) VALUES (${req.query.t_id},'zohocrm', ${result.data.access_token}, ${result.data.refresh_token}, ${info.data.Email}, ${req.query.accountURL})
            ON CONFLICT (tp_customer_id, tp_id)
            DO UPDATE SET
                tp_access_token = EXCLUDED.tp_access_token, 
                tp_refresh_token = EXCLUDED.tp_refresh_token
        `);
                    res.send({ status: 'ok' });
                } catch (error) {
                    console.error('Could not update db', error);
                    res.send({ status: 'error', error: error });
                } finally {
                    await db.dispose();
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
            const db = createConnectionPool(config.PGSQL_URL);
            try {
                await db.query(sql`
            INSERT INTO connections (
               t_id, tp_id, tp_access_token, tp_refresh_token, tp_customer_id
            ) VALUES (${req.query.t_id},'sfdc', ${result.data.access_token}, ${result.data.refresh_token}, 'testSfdcUser')
            ON CONFLICT (tp_customer_id, tp_id)
            DO UPDATE SET
                tp_access_token = EXCLUDED.tp_access_token, 
                tp_refresh_token = EXCLUDED.tp_refresh_token
        `);
                res.send({ status: 'ok', tp_customer_id: 'testSfdcUser' });
            } catch (error) {
                console.error('Could not update db', error);
                res.send({ status: 'error', error: error });
            } finally {
                await db.dispose();
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
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const fields = req.query.fields;
        console.log('Revert::GET ALL LEADS', tenantId, thirdPartyId, thirdPartyToken);
        if (thirdPartyId === 'hubspot') {
            const leads = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/contacts?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            res.send({
                results: filterLeadsFromContactsForHubspot(leads.data.results as any[]),
            });
        } else if (thirdPartyId === 'zohocrm') {
            const leads = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Leads?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            res.send({ results: leads.data.data });
        } else if (thirdPartyId === 'sfdc') {
            // NOTE: Handle "ALL" for Hubspot & Zoho
            const query =
                fields === 'ALL'
                    ? 'SELECT+fields(all)+from+Lead+limit+200'
                    : `SELECT+${(fields as string).split(',').join('+,+')}+from+Lead`;
            const leads = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/query/?q=${query}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            res.send({ results: leads.data });
        } else {
            res.send({});
        }
    } catch (error) {
        console.error('Could not update db', error);
    }
});

// Get a lead object identified by {id}
crmRouter.get('/lead/:id', customerMiddleware(), async (req, res) => {
    try {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const leadId = req.params.id;
        const fields = req.query.fields;
        console.log('Revert::GET LEAD', tenantId, thirdPartyId, thirdPartyToken, leadId);
        if (thirdPartyId === 'hubspot') {
            const lead = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/contacts/${leadId}?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });

            res.send({
                result: filterLeadsFromContactsForHubspot([lead.data] as any[]),
            });
        } else if (thirdPartyId === 'zohocrm') {
            const leads = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Leads/${leadId}?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            res.send({ result: leads.data.data });
        } else if (thirdPartyId === 'sfdc') {
            const leads = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Lead/${leadId}`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            res.send({ result: leads.data });
        } else {
            res.status(400).send({
                error: 'Unrecognised CRM',
            });
        }
    } catch (error: any) {
        console.error('Could not update db', error);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Create a lead
crmRouter.post('/lead', tenantMiddleware(), async (req, res) => {
    try {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const lead = req.body;
        console.log('Revert::CREATE LEAD', tenantId, lead);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/contacts/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            res.send({
                status: 'ok',
                message: 'Hubspot lead created',
                result: lead,
            });
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'post',
                url: `https://www.zohoapis.com/crm/v3/Leads`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            res.send({ status: 'ok', message: 'Zoho lead created', result: lead });
        } else if (thirdPartyId === 'sfdc') {
            const leadCreated = await axios({
                method: 'post',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Lead/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            res.send({
                status: 'ok',
                message: 'SFDC lead created',
                result: leadCreated.data,
            });
        } else {
            res.status(400).send({
                error: 'Unrecognised CRM',
            });
        }
    } catch (error: any) {
        console.error('Could not update db', error.response);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Update a lead identified by {id}
crmRouter.patch('/lead/:id', tenantMiddleware(), async (req, res) => {
    try {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const lead = req.body;
        const leadId = req.params.id;
        console.log('Revert::UPDATE LEAD', tenantId, lead, leadId);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'patch',
                url: `https://api.hubapi.com/crm/v3/objects/contacts/${leadId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            res.send({
                status: 'ok',
                message: 'Hubspot lead created',
                result: lead,
            });
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'put',
                url: `https://www.zohoapis.com/crm/v3/Leads/${leadId}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            res.send({ status: 'ok', message: 'Zoho lead updated', result: lead });
        } else if (thirdPartyId === 'sfdc') {
            await axios({
                method: 'patch',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Lead/${leadId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(lead),
            });
            res.send({ status: 'ok', message: 'SFDC lead updated', result: lead });
        } else {
            res.status(400).send({
                error: 'Unrecognised CRM',
            });
        }
    } catch (error: any) {
        console.error('Could not update db', error.response);
        res.status(500).send({
            error: 'Internal server error',
        });
    }
});

// Search a lead with query.
crmRouter.post('/leads/search', tenantMiddleware(), async (req, res) => {
    try {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const searchCriteria = req.body.searchCriteria;
        console.log('Revert::SEARCH LEAD', tenantId, searchCriteria);
        if (thirdPartyId === 'hubspot') {
            const result = await axios({
                method: 'post',
                url: `https://api.hubapi.com/crm/v3/objects/contacts/search`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify({
                    ...searchCriteria,
                    properties: ['hs_lead_status', 'firstname', 'email', 'lastname', 'hs_object_id'],
                }),
            });
            res.send({
                status: 'ok',
                results: filterLeadsFromContactsForHubspot([result?.data.results] as any[]),
            });
        } else if (thirdPartyId === 'zohocrm') {
            const result = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Leads/search?criteria=${searchCriteria}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });

            res.send({ status: 'ok', results: result?.data });
        } else if (thirdPartyId === 'sfdc') {
            const result = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/search?q=${searchCriteria}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });

            res.send({ status: 'ok', results: result?.data });
        } else {
            res.status(400).send({
                error: 'Unrecognised CRM',
            });
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
crmRouter.get('/companies', async (_req, res) => {
    res.send({
        data: 'ok',
    });
});

// Get a company object identified by {id}
crmRouter.get('/company', async (_req, res) => {
    try {
        res.send({
            data: 'ok',
        });
    } catch (error) {
        res.send({
            message: 'Could not create cron',
            error: error,
        });
    }
});

// Create a company
crmRouter.post('/company', async (_req, res) => {
    res.send({
        data: 'ok',
    });
});

// Update a company identified by {id}
crmRouter.patch('/company', async (_req, res) => {
    res.send({
        data: 'ok',
    });
});

// Search a company with query.
crmRouter.post('/companies/search', async (_req, res) => {
    res.send({
        data: 'ok',
    });
});

/**
 * Contacts API
 */
// Get all contacts (paginated)
crmRouter.get('/contacts', async (_req, res) => {
    res.send({
        data: 'ok',
    });
});

// Get a contact object identified by {id}
crmRouter.get('/contact', async (_req, res) => {
    try {
        res.send({
            data: 'ok',
        });
    } catch (error) {
        res.send({
            message: 'Could not create cron',
            error: error,
        });
    }
});

// Create a contact
crmRouter.post('/contact', async (_req, res) => {
    res.send({
        data: 'ok',
    });
});

// Update a contact identified by {id}
crmRouter.patch('/contact', async (_req, res) => {
    res.send({
        data: 'ok',
    });
});

// Search a contact with query.
crmRouter.post('/contacts/search', async (_req, res) => {
    res.send({
        data: 'ok',
    });
});

export default crmRouter;
