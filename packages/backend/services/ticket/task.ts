import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import { TaskService } from '../../generated/typescript/api/resources/ticket/resources/task/service/TaskService';
import axios from 'axios';
import { UnifiedTicketTask } from '../../models/unified/ticketTask';
import { disunifyTicketObject, unifyObject } from '../../helpers/crm/transform';
import { TicketStandardObjects } from '../../constants/common';

const objType = TicketStandardObjects.ticketTask;

const taskServiceTicket = new TaskService(
    {
        async getTask(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
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
                              }
                              assignee {
                                id
                              }
                              parent {
                                id
                              }
                              createdAt
                              updatedAt
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

                        const unifiedTask = await unifyObject<any, UnifiedTicketTask>({
                            obj: result.data.data.issue,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedTask,
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

                        const unifiedTask = await unifyObject<any, UnifiedTicketTask>({
                            obj: result.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedTask,
                        });
                        break;
                    }
                    case TP_ID.jira: {
                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/rest/api/2/issue/${taskId}`,
                            headers: {
                                Accept: 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
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
                const account = res.locals.account;
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
                        const query = `query IssueQuery {
                            issues {
                              nodes {
                                id
                              title
                              dueDate
                              description
                              creator {
                                id
                              }
                              assignee {
                                id
                              }
                              parent {
                                id
                              }
                              createdAt
                              updatedAt
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

                        const unifiedTasks: any = await Promise.all(
                            result.data.data.issues.nodes.map(
                                async (task: any) =>
                                    await unifyObject<any, UnifiedTicketTask>({
                                        obj: task,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );

                        res.send({
                            status: 'ok',
                            next: 'NEXT_CURSOR',
                            previous: 'PREVIOUS_CURSOR',
                            results: unifiedTasks,
                        });

                        break;
                    }
                    case TP_ID.clickup: {
                        const pagingString = `${cursor ? `page=${cursor}` : ''}`;

                        const result = await axios({
                            method: 'get',
                            url: `https://api.clickup.com/api/v2/list/901600406578/task?${pagingString}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        const unifiedTasks: any = await Promise.all(
                            result.data.tasks.map(
                                async (task: any) =>
                                    await unifyObject<any, UnifiedTicketTask>({
                                        obj: task,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );

                        const pageNumber = !result.data?.last_page
                            ? cursor
                                ? (parseInt(String(cursor)) + 1).toString()
                                : '1'
                            : undefined;

                        res.send({
                            status: 'ok',
                            next: pageNumber,
                            previous: undefined,
                            results: unifiedTasks,
                        });
                        break;
                    }
                    case TP_ID.jira: {
                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/rest/api/2/search`,
                            headers: {
                                Accept: 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });

                        res.send({
                            status: 'ok',
                            next: 'NEXT_CURSOR',
                            previous: 'PREV_CURSOR',
                            results: result.data.issues,
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
        async createTask(req, res) {
            try {
                const taskData = req.body as UnifiedTicketTask;
                const connection = res.locals.connection;
                const account = res.locals.account;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                // const task: any = disunifyTicketTask(taskData, thirdPartyId);
                const task: any = await disunifyTicketObject<UnifiedTicketTask>({
                    obj: taskData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                logInfo('Revert::CREATE TASK', connection.app?.env?.accountId, tenantId, taskData);

                switch (thirdPartyId) {
                    case TP_ID.linear: {
                        const mutation = `mutation IssueCreate($input: IssueCreateInput!) {
                            issueCreate(input: $input) {
                              success
                              issue {
                                title
                                description
                                assignee {
                                  id
                                }
                                dueDate
                              }
                            }
                          }`;

                        const result: any = await axios({
                            method: 'post',
                            url: 'https://api.linear.app/graphql',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify({ query: mutation, variables: { input: task } }),
                        });

                        res.send({ status: 'ok', message: 'Linear task created', result: result.data });
                        break;
                    }
                    case TP_ID.clickup: {
                        const result: any = await axios({
                            method: 'post',
                            url: `https://api.clickup.com/api/v2/list/${task.listId}/task`,
                            headers: {
                                Authorization: `${thirdPartyToken}`,
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(task),
                        });
                        console.log('DEBUG', 'result...', result);
                        res.send({ status: 'ok', message: 'Clickup task created', result: result.data });

                        break;
                    }
                    case TP_ID.jira: {
                        const jiraPost = {
                            fields: {
                                assignee: {
                                    id: '5d53f3cbc6b9320d9ea5bdc2',
                                },
                                project: {
                                    key: 'KAN',
                                },
                                summary: taskData,
                                issuetype: {
                                    id: 10001,
                                },
                            },
                        };
                        const result = await axios({
                            method: 'post',
                            url: `${connection.tp_account_url}/rest/api/2/issue`,
                            headers: {
                                'Content-Type': 'application/json',
                                Accept: 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(jiraPost),
                        });

                        res.send({ status: 'ok', message: 'Jira task created', result: result.data });

                        break;
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not create task', error.response);
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
