import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import { UserService } from '../../generated/typescript/api/resources/ticket/resources/user/service/UserService';
import axios from 'axios';

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

                        res.send({
                            status: 'ok',
                            result: result.data,
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
        async getUsers(req, res) {
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
                console.log(req.query);
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

                        res.send({
                            status: 'ok',
                            next: 'NEXT_CURSOR',
                            previous: 'PREVIOUS_CURSOR',
                            results: result.data,
                        });

                        break;
                    }
                    case TP_ID.clickup: {
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
