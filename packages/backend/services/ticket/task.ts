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
import { LinearClient } from '@linear/sdk';

const objType = TicketStandardObjects.ticketTask;

const taskServiceTicket = new TaskService(
    {
        async getTask(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const taskId = req.params.id;
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
                        const linear = new LinearClient({
                            accessToken: thirdPartyToken,
                        });
                        const task: any = await linear.issue(taskId);
                        const state = await linear.workflowState(task._state.id);
                        let modifiedTask = { ...task, state: { name: state.name } };

                        const unifiedTask: any = await unifyObject<any, UnifiedTicketTask>({
                            obj: modifiedTask,
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

                        const unifiedTask: any = await unifyObject<any, UnifiedTicketTask>({
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
                        result.data.fields.id = result.data.id;
                        const unifiedTask: any = await unifyObject<any, UnifiedTicketTask>({
                            obj: result.data.fields,
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
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch task', error);
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
                const fields: any = req.query.fields;
                const pageSize = parseInt(String(req.query.pageSize));
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
                    // @TODO Query won't fetch data for fields provided in additional column
                    case TP_ID.linear: {
                        const linear = new LinearClient({
                            accessToken: thirdPartyToken,
                        });
                        /*
                            In GraphQL, either 'first' & 'after' or 'last' & 'before' can exist but not both simultaneously.
                            To determine the appropriate pagination direction, an additional flag parameter is required.
                        */
                        const variables = {
                            first: pageSize ? pageSize : null,
                            after: cursor ? cursor : null,
                            last: null,
                            Before: null,
                        };
                        const result: any = await linear.issues(variables);

                        const unifiedTasks: any = await Promise.all(
                            result.nodes.map(async (task: any) => {
                                const state = await linear.workflowState(task._state.id);
                                let modifiedTask = { ...task, state: { name: state.name } };
                                return await unifyObject<any, UnifiedTicketTask>({
                                    obj: modifiedTask,
                                    tpId: thirdPartyId,
                                    objType,
                                    tenantSchemaMappingId: connection.schema_mapping_id,
                                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                                });
                            })
                        );
                        const pageInfo = result.pageInfo;
                        let next_cursor = undefined;
                        if (pageInfo.hasNextPage && pageInfo.endCursor) {
                            next_cursor = pageInfo.endCursor;
                        }

                        let previous_cursor = undefined;
                        if (pageInfo.hasPreviousPage && pageInfo.startCursor) {
                            previous_cursor = pageInfo.startCursor;
                        }

                        res.send({
                            status: 'ok',
                            next: next_cursor,
                            previous: previous_cursor,
                            results: unifiedTasks,
                        });

                        break;
                    }
                    case TP_ID.clickup: {
                        let parsedFields: any = fields ? JSON.parse(fields) : undefined;
                        const pagingString = `${cursor ? `page=${cursor}` : ''}`;
                        // &statuses[]=complete
                        const result = await axios({
                            method: 'get',
                            url: `https://api.clickup.com/api/v2/list/${parsedFields.listId}/task?${pagingString}`,
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
                            url: `${connection.tp_account_url}/rest/api/2/search?jql=project=KAN&maxResults=`,
                            headers: {
                                Accept: 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });

                        const unifiedTasks = await Promise.all(
                            result.data.issues.map(async (issue: any) => {
                                issue.fields.id = issue.id;
                                return await unifyObject<any, UnifiedTicketTask>({
                                    obj: issue.fields,
                                    tpId: thirdPartyId,
                                    objType,
                                    tenantSchemaMappingId: connection.schema_mapping_id,
                                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                                });
                            })
                        );

                        res.send({
                            status: 'ok',
                            next: 'NEXT_CURSOR',
                            previous: 'PREVIOUS_CURSOR',
                            results: unifiedTasks,
                        });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch tasks', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createTask(req, res) {
            try {
                const taskData: any = req.body as unknown as UnifiedTicketTask;
                const connection = res.locals.connection;
                const account = res.locals.account;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const task: any = await disunifyTicketObject<UnifiedTicketTask>({
                    obj: taskData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                logInfo('Revert::CREATE TASK', connection.app?.env?.accountId, tenantId, taskData);

                switch (thirdPartyId) {
                    // @TODO Query will fail if additional fields are posted
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
                                priority
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
                        res.send({ status: 'ok', message: 'Clickup task created', result: result.data });

                        break;
                    }
                    case TP_ID.jira: {
                        const result = await axios({
                            method: 'post',
                            url: `${connection.tp_account_url}/rest/api/2/issue`,
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(task),
                        });

                        res.send({
                            status: 'ok',
                            message: 'Task created in jira',
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
                console.error('Could not create task', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateTask(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const taskData = req.body as unknown as UnifiedTicketTask;
                const taskId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const task: any = await disunifyTicketObject<UnifiedTicketTask>({
                    obj: taskData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                logInfo('Revert::UPDATE TASK', connection.app?.env?.accountId, tenantId, taskData);

                switch (thirdPartyId) {
                    /* @TODO This might encounter issues with unrecognized patterns or schema, for instance, attempting to set 'issueID' within the request body of the 'revert' API 
                    might not conform to the expected GraphQL syntax, such as {issue: {id}}. */
                    case TP_ID.linear: {
                        const mutation = `mutation Mutation($input: IssueUpdateInput!, $issueUpdateId: String!) {
                            issueUpdate(input: $input, id: $issueUpdateId) {
                              success
                              issue {
                                ${Object.keys(task).join('\n')}
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
                            data: JSON.stringify({
                                query: mutation,
                                variables: { input: task, issueUpdateId: taskId },
                            }),
                        });

                        res.send({
                            status: 'ok',
                            message: 'Linear Task updated',
                            result: result.data,
                        });

                        break;
                    }
                    case TP_ID.clickup: {
                        const result = await axios({
                            method: 'put',
                            url: `https://api.clickup.com/api/v2/task/${taskId}`,
                            headers: {
                                Authorization: `${thirdPartyToken}`,
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(task),
                        });

                        res.send({
                            status: 'ok',
                            message: 'Clickup Task updated',
                            result: result.data,
                        });

                        break;
                    }
                    case TP_ID.jira: {
                        const result: any = await axios({
                            method: 'put',
                            url: `${connection.tp_account_url}/rest/api/2/issue/${taskId}`,
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(task),
                        });

                        res.send({
                            status: 'ok',
                            message: 'Jira task updated',
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
                console.error('Could not update task', error);
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
