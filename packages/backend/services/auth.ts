import mongoose from 'mongoose';

import { Account } from '../models/account';
import { Workspace } from '../models/workspace';
import createConnectionPool, { sql } from '@databases/pg';
import { parseJwt } from '../helpers/oAuthHelper';
import axios from 'axios';
import config from '../config';
import qs from 'qs';
class AuthService {
    async createUserOnClerkUserCreation(webhookData: any, webhookEventType: string) {
        let response;
        if (webhookData && ['user.created', 'user.updated'].includes(webhookEventType)) {
            try {
                let toUpdate: any = {
                    id: webhookData.id,
                    data: webhookData,
                };
                let createdWorkspace;
                if ('user.created' === webhookEventType) {
                    createdWorkspace = new Workspace({
                        name: `${webhookData.first_name} 's workspace`,
                        account: webhookData.id,
                        skipWaitlist: false,
                    });
                    await createdWorkspace.save();
                    toUpdate = {
                        ...toUpdate,
                        workspace: createdWorkspace._id,
                    };
                }
                response = await Account.findOneAndUpdate({ id: webhookData.id }, { $set: toUpdate }, { upsert: true });
            } catch (e) {
                console.error(e);
                response = { error: e };
            }
        }
        return response;
    }

    async getWorkspaceForAccount(accountId: string) {
        let result;
        try {
            result = await Account.findOne({ id: accountId });
            const workspaceId = result && result.workspace;
            if (!workspaceId) {
                result = {
                    message: 'error',
                    error: 'Could not find workspace.',
                };
            } else {
                const id = new mongoose.Types.ObjectId(workspaceId);
                const workspace = await Workspace.findOne({
                    _id: id,
                });
                if (!workspace?.skipWaitlist) {
                    result = {
                        error: 'waitlist_error',
                        message: 'You are on our waitlist',
                    };
                } else {
                    result = {
                        message: 'ok',
                        workspaceId: workspaceId,
                        workspace: workspace,
                    };
                }
            }
        } catch (e) {
            console.error(e);
            result = { error: e };
        }
        return result;
    }
    async saveOAuthDataOnWorkspace(workspaceId: string, data: { key: string; value: any }) {
        if (data.key === 'slack') {
            await this.updateSlackBotTokensForTeams(data);
        }

        if (workspaceId) {
            if (data.key === 'slack') {
                const existingOAuthForTeam = await Workspace.findOneAndUpdate(
                    {
                        _id: new mongoose.Types.ObjectId(workspaceId),
                        oauth: {
                            $elemMatch: {
                                'team.id': data.value.team.id,
                            },
                        },
                    },
                    {
                        $set: {
                            'oauth.$.scope': data.value.team.scope,
                            'oauth.$.access_token': data.value.access_token,
                            'oauth.$.authed_user': data.value.authed_user,
                        },
                    }
                );
                if (existingOAuthForTeam) {
                    console.log('Existing oauth updated for ', data.value.team.id);
                    return { status: 'ok', result: existingOAuthForTeam };
                }
            } else if (data.key === 'gsheet' || data.key === 'gmail') {
                const user = parseJwt(data.value.id_token);
                data.value.email = user.email;
                const existingOAuthForEmail = await Workspace.findOneAndUpdate(
                    {
                        _id: new mongoose.Types.ObjectId(workspaceId),
                        oauth: {
                            $elemMatch: {
                                email: user.email,
                                type: data.key,
                            },
                        },
                    },
                    {
                        $set: {
                            'oauth.$.scope': data.value.scope,
                            'oauth.$.access_token': data.value.access_token,
                            'oauth.$.refresh_token': data.value.refresh_token,
                        },
                    }
                );
                if (existingOAuthForEmail) {
                    console.log('Existing oauth updated for', user.email);
                    return { status: 'ok', result: existingOAuthForEmail };
                }
            }

            const updateQuery = {
                oauth: { ...data.value, type: data.key },
            };
            const result = await Workspace.findOneAndUpdate(
                {
                    _id: new mongoose.Types.ObjectId(workspaceId),
                },
                {
                    $addToSet: updateQuery,
                    upsert: true,
                }
            );
            return { status: 'ok', result: result };
        }
        return { status: 'ok', message: 'Added without workspace' };
    }
    async updateSlackBotTokensForTeams(data: { key: string; value: any }) {
        const db = createConnectionPool(config.PGSQL_URL);
        try {
            await db.query(sql`
      INSERT INTO slack_bot_tokens (
        team_id, team_name, token, quota
      ) VALUES (${data.value.team.id}, ${data.value.team.name}, ${data.value.access_token}, 7)
      ON CONFLICT (team_id)
      DO UPDATE SET
        token = EXCLUDED.token
    `);
        } catch (error) {
            console.error('Could not update db', error);
        } finally {
            await db.dispose();
        }
    }

    async refreshOAuthTokens() {
        const workspaces = await Workspace.find({
            $or: [{ 'oauth.type': 'gsheet' }, { 'oauth.type': 'gmail' }],
        });
        workspaces?.forEach(async (workspace) => {
            const newOAuth = [];
            let updated = false;
            for (let i = 0; i < workspace.oauth.length; i++) {
                const oauth = workspace.oauth[i];
                if (oauth.type === 'gsheet' || oauth.type === 'gmail') {
                    // TODO: Make this work for other services as well.
                    const refreshToken = oauth.refresh_token;
                    const refreshURL = `https://accounts.google.com/o/oauth2/token?refresh_token=${refreshToken}&client_id=${config.GOOGLE_CLIENT_ID}&client_secret=${config.GOOGLE_CLIENT_SECRET}&grant_type=refresh_token`;
                    const refreshedCreds = await axios.post(refreshURL);
                    oauth.access_token = refreshedCreds.data.access_token;
                    updated = true;
                }
                newOAuth.push(oauth);
            }
            if (updated) {
                workspace.oauth = newOAuth;
                await Workspace.updateOne({ _id: workspace._id }, workspace);
            }
        });
        return { status: 'ok', message: 'Tokens refreshed' };
    }

    /**
     * Revert specific.
     * @returns
     */
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
                        // Refresh the hubspot token.
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
