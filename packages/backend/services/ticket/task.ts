import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import { TaskService } from '../../generated/typescript/api/resources/ticket/resources/task/service/TaskService';
import axios from 'axios';

const taskServiceTicket = new TaskService(
    {
        async getTask(req, res) {
            try {
                const connection = res.locals.connection;
                // const account = res.locals.account;
                const taskId = req.params.id;
                // const fields = req.query.fields;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo(
                    'Revert::GET TASK',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    taskId
                );

                switch (thirdPartyId) {
                    case TP_ID.linear: {
                        const query = `query IssueQuery($taskId: String!) {
                            issue(id: $taskId) {
                              id
                              title
                              dueDate
                              description
                              creator {
                                id
                                name
                              }
                              assignee {
                                name
                                id
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
                            data: JSON.stringify({ query: query, variables: { taskId } }),
                        });

                        res.send({
                            status: 'ok',
                            result: result.data,
                        });
                        break;
                    }
                    case TP_ID.clickup: {
                        const result = await axios({
                            method: 'get',
                            url: `https://api.clickup.com/api/v2/task/${taskId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'Content-Type': 'application/json',
                            },
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
        async getTasks(req, res) {
            try {
                const connection = res.locals.connection;
                // const account = res.locals.account;
                // const fields = req.query.fields;
                // const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo(
                    'Revert::GET ALL TASKS',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken
                );

                switch (thirdPartyId) {
                    case TP_ID.linear: {
                        // const pageSize = 10;
                        const query = `query IssueQuery {
                            issues {
                              nodes {
                                assignee {
                                  id
                                  email
                                  name
                                }
                                createdAt
                                updatedAt
                                id
                                title
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
                        const pagingString = `${cursor ? `page=${cursor}` : ''}`;

                        const result = await axios({
                            method: 'get',
                            url: `https://api.clickup.com/api/v2/list/901600412756/task?${pagingString}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        const pageNumber = !result.data?.last_page
                            ? cursor
                                ? (parseInt(String(cursor)) + 1).toString()
                                : '1'
                            : undefined;

                        res.send({
                            status: 'ok',
                            next: pageNumber,
                            previous: undefined,
                            results: result.data.tasks,
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

export { taskServiceTicket };
