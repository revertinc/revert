import createConnectionPool, { sql } from '@databases/pg';
import axios from 'axios';
import config from '../config';
import qs from 'qs';
class AuthService {
    async refreshOAuthTokensForThirdParty() {
        const db = createConnectionPool(config.PGSQL_URL);
        try {
            const connections = await db.query(sql`SELECT * FROM connections`);
            for (let i = 0; i < connections.length; i++) {
                const connection = connections[i];
                if (connection.tp_refresh_token) {
                    if (connection.tp_id === 'hubspot') {
                        // Refresh the hubspot token.
                        const url = 'https://api.hubapi.com/oauth/v1/token';
                        const formData = {
                            grant_type: 'refresh_token',
                            client_id: config.HUBSPOT_CLIENT_ID,
                            client_secret: config.HUBSPOT_CLIENT_SECRET,
                            redirect_uri: 'https://app.buildwithforest.com/oauth-callback/hubspot',
                            refresh_token: connection.tp_refresh_token,
                        };
                        const result = await axios({
                            method: 'post',
                            url: url,
                            data: qs.stringify(formData),
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                            },
                        });
                        await db.query(sql` 
            UPDATE connections SET tp_access_token = ${result.data.access_token}, 
            tp_refresh_token = ${result.data.refresh_token}
            WHERE tp_customer_id = ${connection.tp_customer_id}
            AND tp_id = ${connection.tp_id}
            ;`);
                        console.log('OAuth creds refreshed for hubspot');
                    } else if (connection.tp_id === 'zohocrm') {
                        // Refresh the zoho-crm token.
                        const url = `${connection.tp_account_url}/oauth/v2/token`;
                        const formData = {
                            grant_type: 'refresh_token',
                            client_id: config.ZOHOCRM_CLIENT_ID,
                            client_secret: config.ZOHOCRM_CLIENT_SECRET,
                            redirect_uri: 'https://app.buildwithforest.com/oauth-callback/zohocrm',
                            refresh_token: connection.tp_refresh_token,
                        };
                        const result = await axios({
                            method: 'post',
                            url: url,
                            data: qs.stringify(formData),
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                            },
                        });
                        if (result.data && result.data.access_token) {
                            await db.query(sql` 
            UPDATE connections SET tp_access_token = ${result.data.access_token}
            WHERE tp_customer_id = ${connection.tp_customer_id}
            AND tp_id = ${connection.tp_id}
            ;`);
                            console.log('OAuth creds refreshed for zohocrm');
                        } else {
                            console.log('Zoho connection could not be refreshed', result);
                        }
                    } else if (connection.tp_id === 'sfdc') {
                        // Refresh the hubspot token.
                        const url = `https://login.salesforce.com/services/oauth2/token`;
                        const formData = {
                            grant_type: 'refresh_token',
                            client_id: config.SFDC_CLIENT_ID,
                            client_secret: config.SFDC_CLIENT_SECRET,
                            redirect_uri: 'https://app.buildwithforest.com/oauth-callback/sfdc',
                            refresh_token: connection.tp_refresh_token,
                        };
                        const result = await axios({
                            method: 'post',
                            url: url,
                            data: qs.stringify(formData),
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                            },
                        });
                        if (result.data && result.data.access_token) {
                            await db.query(sql` 
            UPDATE connections SET tp_access_token = ${result.data.access_token}
            WHERE tp_customer_id = ${connection.tp_customer_id}
            AND tp_id = ${connection.tp_id}
            ;`);
                            console.log('OAuth creds refreshed for sfdc');
                        } else {
                            console.log('SFDC connection could not be refreshed', result);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Could not update db', error);
        } finally {
            await db.dispose();
        }
        return { status: 'ok', message: 'Tokens refreshed' };
    }
}

export default new AuthService();
