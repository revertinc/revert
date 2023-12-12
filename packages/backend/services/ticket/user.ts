import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import { UserService } from '../../generated/typescript/api/resources/ticket/resources/user/service/UserService';
import axios from 'axios';
import { unifyTicketUser } from '../../models/unified/ticketUsers';

const userServiceTicket = new UserService(
    {
        async getUser(req, res) {
            try {
                const connection = res.locals.connection;
                // const account = res.locals.account;
                const userId = req.params.id;
                // const fields = req.query.fields;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo(
                    'Revert::GET USER',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    userId
                );

                switch (thirdPartyId) {
                    case TP_ID.linear: {
                        const query = `query UsersQuery($userId: String!) {
                            user(id: $userId) {
                              id
                              name
                              email
                              admin
                              active
                              createdAt
                              avatarUrl
                            }
                          }`;

                        const result = await axios({
                            method: 'post',
                            url: 'https://api.linear.app/graphql',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify({ query: query, variables: { userId } }),
                        });
                        const user: any = unifyTicketUser(result.data.data.user, thirdPartyId);

                        res.send({
                            status: 'ok',
                            result: user,
                        });
                        break;
                    }
                    case TP_ID.clickup: {
                        break;
                    }
                    case TP_ID.jira: {
                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/rest/api/2/user?accountId=${userId}`,
                            headers: {
                                Accept: 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });

                        const unifiedUser: any = unifyTicketUser(result.data, thirdPartyId);

                        res.send({
                            status: 'ok',
                            result: unifiedUser,
                        });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch users', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getUsers(_req, res) {
            try {
                const connection = res.locals.connection;
                // const account = res.locals.account;
                // const fields = req.query.fields;
                // const pageSize = parseInt(String(req.query.pageSize));
                // const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo(
                    'Revert::GET ALL USERS',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken
                );
                switch (thirdPartyId) {
                    case TP_ID.linear: {
                        const query = `query UsersQuery {
                            users {
                              nodes {
                                name
                                id
                                email
                                admin
                                active
                                createdAt
                                avatarUrl
                              }
                            }
                          }`;

                        const result = await axios({
                            method: 'post',
                            url: 'https://api.linear.app/graphql',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify({ query: query }),
                        });

                        const unifiedUsers = result.data.data.users.nodes.map((user: any) => {
                            return unifyTicketUser(user, thirdPartyId);
                        });

                        res.send({
                            status: 'ok',
                            next: 'NEXT_CURSOR',
                            previous: 'PREVIOUS_CURSOR',
                            results: unifiedUsers,
                        });

                        break;
                    }
                    case TP_ID.clickup: {
                        break;
                    }
                    case TP_ID.jira: {
                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/rest/api/2/users/search`,
                            headers: {
                                Accept: 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });

                        const unifiedUsers: any = result.data.map((user: any) => {
                            return unifyTicketUser(user, thirdPartyId);
                        });

                        res.send({
                            status: 'ok',
                            next: 'NEXT_CURSOR',
                            previous: 'PREVIOUS_CURSOR',
                            results: unifiedUsers,
                        });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch users', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { userServiceTicket };
