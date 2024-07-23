import axios from 'axios';
import config from '../config';
import qs from 'qs';
import prisma from '../prisma/client';
import { v4 as uuidv4 } from 'uuid';
import isWorkEmail from '../helpers/isWorkEmail';
import { ENV, TP_ID } from '@prisma/client';
import { logInfo, logError } from '../helpers/logger';
import { AppConfig, DEFAULT_SCOPE } from '../constants/common';

class AuthService {
    async refreshOAuthTokensForThirdParty() {
        try {
            const connections = await prisma.connections.findMany({
                include: { app: true },
            });
            for (let i = 0; i < connections.length; i++) {
                const connection = connections[i];
                if (connection.tp_refresh_token) {
                    try {
                        if (connection.tp_id === TP_ID.hubspot) {
                            // Refresh the hubspot token.
                            const url = 'https://api.hubapi.com/oauth/v1/token';
                            const formData = {
                                grant_type: 'refresh_token',
                                client_id: connection.app?.is_revert_app
                                    ? config.HUBSPOT_CLIENT_ID
                                    : connection.app_client_id || config.HUBSPOT_CLIENT_ID,
                                client_secret: connection.app?.is_revert_app
                                    ? config.HUBSPOT_CLIENT_SECRET
                                    : connection.app_client_secret || config.HUBSPOT_CLIENT_SECRET,
                                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/hubspot`,
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
                            await prisma.connections.update({
                                where: {
                                    id: connection.id,
                                },
                                data: {
                                    tp_access_token: result.data.access_token,
                                    tp_refresh_token: result.data.refresh_token,
                                },
                            });
                        } else if (connection.tp_id === TP_ID.zohocrm) {
                            // Refresh the zoho-crm token.
                            const url = `${connection.tp_account_url}/oauth/v2/token`;
                            const formData = {
                                grant_type: 'refresh_token',
                                client_id: connection.app?.is_revert_app
                                    ? config.ZOHOCRM_CLIENT_ID
                                    : connection.app_client_id || config.ZOHOCRM_CLIENT_ID,
                                client_secret: connection.app?.is_revert_app
                                    ? config.ZOHOCRM_CLIENT_SECRET
                                    : connection.app_client_secret || config.ZOHOCRM_CLIENT_SECRET,
                                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/zohocrm`,
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
                                await prisma.connections.update({
                                    where: {
                                        id: connection.id,
                                    },
                                    data: {
                                        tp_access_token: result.data.access_token,
                                    },
                                });
                            } else {
                                logInfo('Zoho connection could not be refreshed', result);
                            }
                        } else if (connection.tp_id === TP_ID.sfdc) {
                            // Refresh the sfdc token.
                            const url = `https://login.salesforce.com/services/oauth2/token`;
                            const formData = {
                                grant_type: 'refresh_token',
                                client_id: connection.app?.is_revert_app
                                    ? config.SFDC_CLIENT_ID
                                    : connection.app_client_id || config.SFDC_CLIENT_ID,
                                client_secret: connection.app?.is_revert_app
                                    ? config.SFDC_CLIENT_SECRET
                                    : connection.app_client_secret || config.SFDC_CLIENT_SECRET,
                                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/sfdc`,
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
                                await prisma.connections.update({
                                    where: {
                                        id: connection.id,
                                    },
                                    data: {
                                        tp_access_token: result.data.access_token,
                                    },
                                });
                            } else {
                                logInfo('SFDC connection could not be refreshed', result);
                            }
                        } else if (connection.tp_id === TP_ID.pipedrive) {
                            // Refresh the pipedrive token.
                            const url = 'https://oauth.pipedrive.com/oauth/token';
                            const formData = {
                                grant_type: 'refresh_token',
                                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/pipedrive`,
                                refresh_token: connection.tp_refresh_token,
                            };
                            const result = await axios({
                                method: 'post',
                                url: url,
                                data: qs.stringify(formData),
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                                    Authorization: `Basic ${Buffer.from(
                                        `${
                                            connection.app?.is_revert_app
                                                ? config.PIPEDRIVE_CLIENT_ID
                                                : connection.app?.app_client_id || config.PIPEDRIVE_CLIENT_ID
                                        }:${
                                            connection.app?.is_revert_app
                                                ? config.PIPEDRIVE_CLIENT_SECRET
                                                : connection.app?.app_client_secret || config.PIPEDRIVE_CLIENT_SECRET
                                        }`,
                                    ).toString('base64')}`,
                                },
                            });
                            await prisma.connections.update({
                                where: {
                                    id: connection.id,
                                },
                                data: {
                                    tp_access_token: result.data.access_token,
                                    tp_refresh_token: result.data.refresh_token,
                                },
                            });
                        } else if (connection.tp_id === TP_ID.closecrm) {
                            // Refresh the close-crm token.
                            const url = `https://api.close.com/oauth2/token/`;
                            const formData = {
                                grant_type: 'refresh_token',
                                client_id: connection.app?.is_revert_app
                                    ? config.CLOSECRM_CLIENT_ID
                                    : connection.app_client_id || config.CLOSECRM_CLIENT_ID,
                                client_secret: connection.app?.is_revert_app
                                    ? config.CLOSECRM_CLIENT_SECRET
                                    : connection.app_client_secret || config.CLOSECRM_CLIENT_SECRET,
                                refresh_token: connection.tp_refresh_token,
                            };
                            const result = await axios({
                                method: 'post',
                                url: url,
                                data: qs.stringify(formData),
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            });

                            if (result.data && result.data.access_token) {
                                await prisma.connections.update({
                                    where: {
                                        id: connection.id,
                                    },
                                    data: {
                                        tp_access_token: result.data.access_token,
                                        tp_refresh_token: result.data.refresh_token,
                                    },
                                });
                            } else {
                                logInfo('CLOSE CRM connection could not be refreshed', result);
                            }
                        } else if (connection.tp_id === TP_ID.ms_dynamics_365_sales) {
                            let formData: any = {
                                client_id: connection.app_client_id || config.MS_DYNAMICS_SALES_CLIENT_ID,
                                client_secret: connection.app_client_secret || config.MS_DYNAMICS_SALES_CLIENT_SECRET,
                                grant_type: 'refresh_token',
                                //@TODO make this dynamic
                                scope: `${connection.tp_account_url}/.default`,
                                refresh_token: connection.tp_refresh_token,
                            };
                            formData = new URLSearchParams(formData);
                            const result = await axios({
                                method: 'post',
                                url: `https://login.microsoftonline.com/organizations/oauth2/v2.0/token`,
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                                data: formData,
                            });

                            if (result.data && result.data.access_token && result.data.refresh_token) {
                                await prisma.connections.update({
                                    where: {
                                        id: connection.id,
                                    },
                                    data: {
                                        tp_access_token: result.data.access_token,
                                        tp_refresh_token: result.data.refresh_token,
                                    },
                                });
                            } else {
                                logInfo('Microsoft Dynamics Sales connection could not be refreshed', result);
                            }
                        }
                    } catch (error: any) {
                        logError(error.response?.data);
                        console.error('Could not refresh token', connection.t_id, error.response?.data);
                    }
                }
            }
        } catch (error: any) {
            logError(error);
            console.error('Could not update db', error.response?.data);
        }
        return { status: 'ok', message: 'Tokens refreshed' };
    }

    async refreshOAuthTokensForThirdPartyChatServices() {
        try {
            const connections = await prisma.connections.findMany({
                include: { app: true },
            });

            for (let i = 0; i < connections.length; i++) {
                const connection = connections[i];
                if (connection.tp_refresh_token) {
                    try {
                        if (connection.tp_id === TP_ID.slack) {
                            // Refresh slack token
                            const url = 'https://slack.com/api/oauth.v2.access';
                            const formData = {
                                grant_type: 'refresh_token',
                                client_id: connection.app?.is_revert_app
                                    ? config.SLACK_CLIENT_ID
                                    : connection.app_client_id || config.SLACK_CLIENT_ID,
                                client_secret: connection.app?.is_revert_app
                                    ? config.SLACK_CLIENT_SECRET
                                    : connection.app_client_secret || config.SLACK_CLIENT_SECRET,
                                // redirect_uri: '' TODO
                                refresh_token: connection.tp_refresh_token,
                            };
                            const result = await axios({
                                method: 'post',
                                url: url,
                                data: qs.stringify(formData),
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                            });

                            await prisma.connections.update({
                                where: {
                                    id: connection.id,
                                },
                                data: {
                                    tp_access_token: result.data.access_token,
                                    tp_refresh_token: result.data.refresh_token,
                                },
                            });
                        }
                    } catch (error: any) {
                        logError(error.response?.data);
                        console.error('Could not refresh token', connection.t_id, error.response?.data);
                    }
                }
            }
        } catch (error: any) {
            logError(error);
            console.error('Could not update db', error.response?.data);
        }
        return { status: 'ok', message: 'Chat services tokens refreshed' };
    }

    async refreshOAuthTokensForThirdPartyTicketServices() {
        try {
            const connections = await prisma.connections.findMany({
                include: { app: true },
            });

            for (let i = 0; i < connections.length; i++) {
                const connection = connections[i];
                if (connection.tp_refresh_token) {
                    try {
                        if (connection.tp_id === TP_ID.jira) {
                            // Refresh jira token
                            const formData = {
                                grant_type: 'refresh_token',
                                client_id: connection.app?.is_revert_app
                                    ? config.JIRA_CLIENT_ID
                                    : connection.app_client_id || config.JIRA_CLIENT_ID,
                                client_secret: connection.app?.is_revert_app
                                    ? config.JIRA_CLIENT_SECRET
                                    : connection.app_client_secret || config.JIRA_CLIENT_SECRET,
                                refresh_token: connection.tp_refresh_token,
                            };
                            const result: any = await axios({
                                method: 'post',
                                url: 'https://auth.atlassian.com/oauth/token',
                                data: JSON.stringify(formData),
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                            });
                            await prisma.connections.update({
                                where: {
                                    id: connection.id,
                                },
                                data: {
                                    tp_access_token: result.data.access_token,
                                    tp_refresh_token: result.data.refresh_token,
                                },
                            });
                        } else if (connection.tp_id === TP_ID.bitbucket) {
                            const url = `https://bitbucket.org/site/oauth2/access_token`;
                            const formData = {
                                grant_type: 'refresh_token',
                                refresh_token: connection.tp_refresh_token,
                            };
                            const headerData = {
                                client_id: connection.app_client_id || config.BITBUCKET_CLIENT_ID,
                                client_secret: connection.app_client_secret || config.BITBUCKET_CLIENT_SECRET,
                            };

                            const encodedClientIdSecret = Buffer.from(
                                headerData.client_id + ':' + headerData.client_secret,
                            ).toString('base64');

                            const result = await axios({
                                method: 'post',
                                url: url,
                                data: qs.stringify(formData),
                                headers: {
                                    Authorization: 'Basic ' + encodedClientIdSecret,
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                            });

                            if (result.data && result.data.access_token) {
                                await prisma.connections.update({
                                    where: {
                                        id: connection.id,
                                    },
                                    data: {
                                        tp_access_token: result.data.access_token,
                                        tp_refresh_token: result.data.refresh_token,
                                    },
                                });
                            } else {
                                logInfo('Bitbucket connection could not be refreshed', result);
                            }
                        }
                    } catch (error: any) {
                        logError(error.response?.data);
                        console.error('Could not refresh token', connection.t_id, error.response?.data);
                    }
                }
            }
        } catch (error: any) {
            logError(error);
            console.error('Could not update db', error.response?.data);
        }
        return { status: 'ok', message: 'Ticket services tokens refreshed' };
    }
    async refreshOAuthTokensForThirdPartyAtsServices() {
        try {
            const connections = await prisma.connections.findMany({
                include: { app: true },
            });

            for (let i = 0; i < connections.length; i++) {
                const connection = connections[i];
                if (connection.tp_refresh_token) {
                    try {
                        if (connection.tp_id === TP_ID.lever) {
                            const env = (connection?.app?.app_config as AppConfig)?.env;

                            let url =
                                env === 'Sandbox'
                                    ? 'https://sandbox-lever.auth0.com/oauth/token'
                                    : 'https://auth.lever.co/oauth/token';

                            // Refresh lever token
                            const formData = {
                                grant_type: 'refresh_token',
                                client_id: connection.app?.is_revert_app
                                    ? config.LEVER_CLIENT_ID
                                    : connection.app_client_id || config.LEVER_CLIENT_ID,
                                client_secret: connection.app?.is_revert_app
                                    ? config.LEVER_CLIENT_SECRET
                                    : connection.app_client_secret || config.LEVER_CLIENT_SECRET,
                                refresh_token: connection.tp_refresh_token,
                            };
                            const result: any = await axios({
                                method: 'post',
                                url: url,
                                data: qs.stringify(formData),
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                            });
                            await prisma.connections.update({
                                where: {
                                    id: connection.id,
                                },
                                data: {
                                    tp_access_token: result.data.access_token,
                                    tp_refresh_token: result.data.refresh_token,
                                },
                            });
                        }
                    } catch (error: any) {
                        logError(error.response?.data);
                        console.error('Could not refresh token', connection.t_id, error.response?.data);
                    }
                }
            }
        } catch (error: any) {
            logError(error);
            console.error('Could not update db', error.response?.data);
        }
        return { status: 'ok', message: 'ATS services tokens refreshed' };
    }
    async refreshOAuthTokensForThirdPartyAccountingServices() {
        try {
            const connections = await prisma.connections.findMany({
                include: { app: true },
            });

            for (let i = 0; i < connections.length; i++) {
                const connection = connections[i];
                if (connection.tp_refresh_token) {
                    try {
                        if (connection.tp_id === TP_ID.xero) {
                            const url = `https://identity.xero.com/connect/token`;
                            const formData = {
                                grant_type: 'refresh_token',
                                refresh_token: connection.tp_refresh_token,
                            };
                            const headerData = {
                                client_id: connection.app_client_id || config.XERO_CLIENT_ID,
                                client_secret: connection.app_client_secret || config.XERO_CLIENT_SECRET,
                            };

                            const encodedClientIdSecret = Buffer.from(
                                headerData.client_id + ':' + headerData.client_secret,
                            ).toString('base64');

                            const result = await axios({
                                method: 'post',
                                url: url,
                                data: qs.stringify(formData),
                                headers: {
                                    Authorization: 'Basic ' + encodedClientIdSecret,
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                            });

                            if (result.data && result.data.access_token) {
                                await prisma.connections.update({
                                    where: {
                                        id: connection.id,
                                    },
                                    data: {
                                        tp_access_token: result.data.access_token,
                                        tp_refresh_token: result.data.refresh_token,
                                    },
                                });
                            } else {
                                logInfo('Xero connection could not be refreshed', result);
                            }
                        } else if (connection.tp_id === TP_ID.quickbooks) {
                            const url = `https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer`;
                            const formData = {
                                grant_type: 'refresh_token',
                                refresh_token: connection.tp_refresh_token,
                            };
                            const headerData = {
                                client_id: connection.app_client_id || config.QUICKBOOKS_CLIENT_ID,
                                client_secret: connection.app_client_secret || config.QUICKBOOKS_CLIENT_SECRET,
                            };

                            const encodedClientIdSecret = Buffer.from(
                                headerData.client_id + ':' + headerData.client_secret,
                            ).toString('base64');

                            const result = await axios({
                                method: 'post',
                                url: url,
                                data: qs.stringify(formData),
                                headers: {
                                    Authorization: 'Basic ' + encodedClientIdSecret,
                                    Accept: 'application/json',
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                            });

                            if (result.data && result.data.access_token) {
                                await prisma.connections.update({
                                    where: {
                                        id: connection.id,
                                    },
                                    data: {
                                        tp_access_token: result.data.access_token,
                                        tp_refresh_token: result.data.refresh_token,
                                    },
                                });
                            } else {
                                logInfo('quickbooks connection could not be refreshed', result);
                            }
                        }
                    } catch (error: any) {
                        logError(error.response?.data);
                        console.error('Could not refresh token', connection.t_id, error.response?.data);
                    }
                }
            }
        } catch (error: any) {
            logError(error);
            console.error('Could not update db', error.response?.data);
        }
        return { status: 'ok', message: 'Ticket services tokens refreshed' };
    }
    async createAccountOnClerkUserCreation(webhookData: any, webhookEventType: string) {
        let response;
        logInfo('webhookData', webhookData, webhookEventType);
        try {
            const userEmail = webhookData.email_addresses[0].email_address;
            let skipWaitlist = true;
            let userDomain = userEmail.split('@').pop();
            let workspaceName = userDomain.charAt(0).toUpperCase() + userDomain.slice(1) + "'s Workspace";
            if (!isWorkEmail(userEmail)) {
                // make the personal email the unique domain.
                workspaceName = 'Personal Workspace';
                userDomain = userEmail;
            }
            if (config.WHITE_LISTED_DOMAINS?.includes(userDomain)) {
                skipWaitlist = true;
            }
            // Create account only if an account does not exist for this user's domain.
            const accountId = 'acc_' + uuidv4();
            const privateTokenDev = 'sk_test_' + uuidv4();
            const publicTokenDev = 'pk_test_' + uuidv4();
            const privateTokenProd = 'sk_live_' + uuidv4();
            const publicTokenProd = 'pk_live_' + uuidv4();
            const account = await prisma.accounts.upsert({
                where: {
                    domain: userDomain,
                },
                update: {},
                create: {
                    id: accountId,
                    private_token: privateTokenProd,
                    public_token: publicTokenProd,
                    tenant_count: 0,
                    domain: userDomain,
                    skipWaitlist: skipWaitlist,
                    workspaceName: workspaceName,
                    environments: {
                        createMany: {
                            data: [
                                {
                                    id: `${accountId}_${ENV.development}`,
                                    env: ENV.development,
                                    private_token: privateTokenDev,
                                    public_token: publicTokenDev,
                                },
                                {
                                    id: `${accountId}_${ENV.production}`,
                                    env: ENV.production,
                                    private_token: privateTokenProd,
                                    public_token: publicTokenProd,
                                },
                            ],
                        },
                    },
                },
                include: { environments: true },
            });
            // Create user.
            await prisma.users.create({
                data: {
                    id: webhookData.id,
                    email: userEmail,
                    domain: userDomain,
                    accountId: account.id,
                },
            });
            // Send onboarding campaign email
            try {
                await axios({
                    method: 'post',
                    url: 'https://app.loops.so/api/v1/transactional',
                    data: JSON.stringify({
                        transactionalId: config.LOOPS_ONBOARDING_TXN_ID,
                        email: userEmail,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${config.LOOPS_API_KEY}`,
                    },
                });
                logInfo('Sent onboarding email');
                // Alert on slack if configured.
                if (config.SLACK_URL) {
                    await axios({
                        method: 'post',
                        url: config.SLACK_URL,
                        data: JSON.stringify({
                            text: `Woot! :zap: ${userEmail} created an account on Revert!\n\n`,
                        }),
                    });
                }
            } catch (error: any) {
                logError(error);
            }
            response = { status: 'ok' };
        } catch (e: any) {
            logError(e);
            console.error(e);
            response = { error: e };
        }
        return response;
    }
    async getAccountForUser(userId: string): Promise<any> {
        if (!userId) {
            return { error: 'Bad request' };
        }
        const account = await prisma.users.findFirst({
            where: {
                id: userId,
                account: {
                    skipWaitlist: true,
                },
            },
            select: {
                account: {
                    include: {
                        environments: {
                            include: {
                                apps: true,
                            },
                        },
                    },
                },
            },
        });
        if (!account) {
            return { error: 'Account does not exist' };
        }

        const appsWithScope = account.account.environments.map((env) => {
            return {
                ...env,
                apps: env.apps.map((app) => {
                    return {
                        ...app,
                        scope: app.scope,
                        env: env.env,
                        available_scope: DEFAULT_SCOPE[app.tp_id],
                    };
                }),
            };
        });

        return {
            ...account,
            account: { ...account.account, environments: appsWithScope },
        };
    }
    async setAppCredentialsForUser({
        appId,
        publicToken,
        clientId,
        clientSecret,
        scopes = [],
        tpId,
        isRevertApp,
        appConfig,
    }: {
        appId: string;
        publicToken: string;
        clientId?: string;
        clientSecret?: string;
        scopes?: string[];
        tpId: TP_ID;
        isRevertApp: boolean;
        appConfig?: AppConfig;
    }): Promise<any> {
        if (!publicToken || !tpId) {
            return { error: 'Bad request' };
        }
        const account = await prisma.apps.update({
            where: {
                id: appId,
            },
            data: {
                ...(clientId && { app_client_id: clientId }),
                ...(clientSecret && { app_client_secret: clientSecret }),
                is_revert_app: isRevertApp,
                ...(scopes.filter(Boolean).length && { scope: scopes }),
                ...(appConfig?.bot_token && { app_config: { bot_token: appConfig.bot_token } }),
                ...(appConfig?.org_url && { app_config: { org_url: appConfig.org_url } }),
                ...(appConfig?.env && { app_config: { env: appConfig.env } }),
                ...(appConfig && appConfig.bot_token === '' && { app_config: { bot_token: '' } }),
                ...(appConfig && appConfig.org_url === '' && { app_config: { org_url: '' } }),
            },
        });
        if (!account) {
            return { error: 'Account does not exist' };
        }

        return account;
    }
}

export default new AuthService();
