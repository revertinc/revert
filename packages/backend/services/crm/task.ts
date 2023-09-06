import axios from 'axios';
import { TP_ID } from '@prisma/client';

import { TaskService } from '../../generated/typescript/api/resources/crm/resources/task/service/TaskService';
import { InternalServerError } from '../../generated/typescript/api/resources/common';
import { NotFoundError } from '../../generated/typescript/api/resources/common';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import revertAuthMiddleware from '../../helpers/authMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { disunifyObject, unifyObject } from '../../helpers/crm/transform';
import { UnifiedTask } from '../../models/unified';
import { PipedrivePagination, PipedriveTask } from '../../constants/pipedrive';
import { StandardObjects } from '../../constants/common';

const objType = StandardObjects.task;

const taskService = new TaskService(
    {
        async getTask(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const taskId = req.params.id;
                const fields = req.query.fields;
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
                    case TP_ID.hubspot: {
                        const formattedFields = [
                            ...String(fields || '').split(','),
                            'hs_task_body',
                            'hs_task_subject',
                            'hs_task_priority',
                            'hs_task_status',
                            'hs_timestamp',
                        ];
                        let task: any = await axios({
                            method: 'get',
                            url: `https://api.hubapi.com/crm/v3/objects/tasks/${taskId}?properties=${formattedFields}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        task = ([task.data] as any[])?.[0];
                        task = await unifyObject<any, UnifiedTask>({
                            obj: { ...task, ...task?.properties },
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: task });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        const tasks = await axios({
                            method: 'get',
                            url: `https://www.zohoapis.com/crm/v3/Tasks/${taskId}?fields=${fields}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                        });
                        let task = await unifyObject<any, UnifiedTask>({
                            obj: tasks.data.data?.[0],
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: task });
                        break;
                    }
                    case TP_ID.sfdc: {
                        const instanceUrl = connection.tp_account_url;
                        const tasks = await axios({
                            method: 'get',
                            url: `${instanceUrl}/services/data/v56.0/sobjects/Task/${taskId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        let task = await unifyObject<any, UnifiedTask>({
                            obj: tasks.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: task });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const result = await axios.get<{ data: Partial<PipedriveTask> } & PipedrivePagination>(
                            `${connection.tp_account_url}/v1/activities/${taskId}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        const task = result.data;
                        res.send({
                            status: 'ok',
                            result: await unifyObject<any, UnifiedTask>({
                                obj: task,
                                tpId: thirdPartyId,
                                objType,
                                tenantSchemaMappingId: connection.schema_mapping_id,
                                accountFieldMappingConfig: account.accountFieldMappingConfig,
                            }),
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch lead', error);
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
                const fields = req.query.fields;
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo(
                    'Revert::GET ALL TASK',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken
                );

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        const formattedFields = [
                            ...String(fields || '').split(','),
                            'hs_task_body',
                            'hs_task_subject',
                            'hs_task_priority',
                            'hs_task_status',
                            'hs_timestamp',
                        ];
                        const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&after=${cursor}` : ''
                        }`;
                        let tasks: any = await axios({
                            method: 'get',
                            url: `https://api.hubapi.com/crm/v3/objects/tasks?properties=${formattedFields}&${pagingString}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        const nextCursor = tasks.data?.paging?.next?.after || undefined;
                        tasks = tasks.data.results as any[];
                        tasks = await Promise.all(
                            tasks?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedTask>({
                                        obj: { ...l, ...l?.properties },
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({
                            status: 'ok',
                            next: nextCursor,
                            previous: undefined, // Field not supported by Hubspot.
                            results: tasks,
                        });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        const pagingString = `${pageSize ? `&per_page=${pageSize}` : ''}${
                            cursor ? `&page_token=${cursor}` : ''
                        }`;
                        let tasks: any = await axios({
                            method: 'get',
                            url: `https://www.zohoapis.com/crm/v3/Tasks?fields=${fields}${pagingString}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                        });
                        const nextCursor = tasks.data?.info?.next_page_token || undefined;
                        const prevCursor = tasks.data?.info?.previous_page_token || undefined;
                        tasks = tasks.data.data;
                        tasks = await Promise.all(
                            tasks?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedTask>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: tasks });
                        break;
                    }
                    case TP_ID.sfdc: {
                        let pagingString = `${pageSize ? `ORDER+BY+Id+DESC+LIMIT+${pageSize}+` : ''}${
                            cursor ? `OFFSET+${cursor}` : ''
                        }`;
                        if (!pageSize && !cursor) {
                            pagingString = 'LIMIT 200';
                        }
                        const instanceUrl = connection.tp_account_url;
                        // TODO: Handle "ALL" for Hubspot & Zoho
                        const query =
                            !fields || fields === 'ALL'
                                ? `SELECT+fields(all)+from+Task+${pagingString}`
                                : `SELECT+${(fields as string).split(',').join('+,+')}+from+Task+${pagingString}`;
                        let tasks: any = await axios({
                            method: 'get',
                            url: `${instanceUrl}/services/data/v56.0/query/?q=${query}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        const nextCursor = pageSize
                            ? String(tasks.data?.totalSize + (parseInt(String(cursor)) || 0))
                            : undefined;
                        const prevCursor =
                            cursor && parseInt(String(cursor)) > 0
                                ? String(parseInt(String(cursor)) - tasks.data?.totalSize)
                                : undefined;
                        tasks = tasks.data?.records;
                        tasks = await Promise.all(
                            tasks?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedTask>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: tasks });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&start=${cursor}` : ''
                        }`;
                        const result = await axios.get<{ data: Partial<PipedriveTask>[] } & PipedrivePagination>(
                            `${connection.tp_account_url}/v1/activities?type=task${pagingString}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        const nextCursor = String(result.data?.additional_data?.pagination.next_start) || undefined;
                        const prevCursor = undefined;
                        const tasks = result.data.data;
                        const unifiedTasks = await Promise.all(
                            tasks?.map(
                                async (d) =>
                                    await unifyObject<any, UnifiedTask>({
                                        obj: d,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: unifiedTasks });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch leads', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createTask(req, res) {
            try {
                const taskData = req.body as UnifiedTask;
                const connection = res.locals.connection;
                const account = res.locals.account;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const task = await disunifyObject<UnifiedTask>({
                    obj: taskData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                console.log('Revert::CREATE TASK', connection.app?.env?.accountId, tenantId, task);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        const response = await axios({
                            method: 'post',
                            url: `https://api.hubapi.com/crm/v3/objects/tasks/`,
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(task),
                        });
                        res.send({
                            status: 'ok',
                            message: 'Hubspot task created',
                            result: { id: response.data?.id, ...task },
                        });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        await axios({
                            method: 'post',
                            url: `https://www.zohoapis.com/crm/v3/Tasks`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(task),
                        });
                        res.send({ status: 'ok', message: 'Zoho task created', result: task });
                        break;
                    }
                    case TP_ID.sfdc: {
                        const instanceUrl = connection.tp_account_url;
                        const taskCreated = await axios({
                            method: 'post',
                            url: `${instanceUrl}/services/data/v56.0/sobjects/Task/`,
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(task),
                        });
                        res.send({
                            status: 'ok',
                            message: 'SFDC task created',
                            result: taskCreated.data,
                        });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const instanceUrl = connection.tp_account_url;
                        const pipedriveTask = task as Partial<PipedriveTask>;
                        const taskCreated = await axios.post<{ data: Partial<PipedriveTask> }>(
                            `${instanceUrl}/v1/activities`,
                            pipedriveTask,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        res.send({
                            status: 'ok',
                            message: 'Pipedrive task created',
                            result: {
                                ...taskCreated.data.data,
                            },
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
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
                const taskData = req.body as UnifiedTask;
                const taskId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const task = await disunifyObject<UnifiedTask>({
                    obj: taskData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                console.log('Revert::UPDATE TASK', connection.app?.env?.accountId, tenantId, task, taskId);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        await axios({
                            method: 'patch',
                            url: `https://api.hubapi.com/crm/v3/objects/tasks/${taskId}`,
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(task),
                        });
                        res.send({
                            status: 'ok',
                            message: 'Hubspot task updated',
                            result: task,
                        });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        await axios({
                            method: 'put',
                            url: `https://www.zohoapis.com/crm/v3/Tasks/${taskId}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(task),
                        });
                        res.send({ status: 'ok', message: 'Zoho task updated', result: task });
                        break;
                    }
                    case TP_ID.sfdc: {
                        const instanceUrl = connection.tp_account_url;
                        await axios({
                            method: 'patch',
                            url: `${instanceUrl}/services/data/v56.0/sobjects/Task/${taskId}`,
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(task),
                        });
                        res.send({ status: 'ok', message: 'SFDC task updated', result: task });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const taskUpdated = await axios.put<{ data: Partial<PipedriveTask> }>(
                            `${connection.tp_account_url}/v1/activities/${taskId}`,
                            task,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        res.send({
                            status: 'ok',
                            message: 'Pipedrive task updated',
                            result: {
                                ...taskUpdated.data.data,
                            },
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not update lead', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async searchTasks(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const fields = req.query.fields;
                const searchCriteria: any = req.body.searchCriteria;
                const formattedFields = (fields || '').split('').filter(Boolean);
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo('Revert::SEARCH TASK', connection.app?.env?.accountId, tenantId, searchCriteria, fields);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        let tasks: any = await axios({
                            method: 'post',
                            url: `https://api.hubapi.com/crm/v3/objects/tasks/search`,
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify({
                                ...searchCriteria,
                                properties: [
                                    'hs_task_body',
                                    'hs_task_subject',
                                    'hs_task_priority',
                                    'hs_task_status',
                                    'hs_timestamp',
                                    ...formattedFields,
                                ],
                            }),
                        });
                        tasks = tasks.data.results as any[];
                        tasks = await Promise.all(
                            tasks?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedTask>({
                                        obj: { ...l, ...l?.properties },
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({
                            status: 'ok',
                            results: tasks,
                        });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        let tasks: any = await axios({
                            method: 'get',
                            url: `https://www.zohoapis.com/crm/v3/Tasks/search?criteria=${searchCriteria}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                        });
                        tasks = tasks.data.data;
                        tasks = await Promise.all(
                            tasks?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedTask>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', results: tasks });
                        break;
                    }
                    case TP_ID.sfdc: {
                        const instanceUrl = connection.tp_account_url;
                        let tasks: any = await axios({
                            method: 'get',
                            url: `${instanceUrl}/services/data/v56.0/search?q=${searchCriteria}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        tasks = tasks?.data?.searchRecords;
                        tasks = await Promise.all(
                            tasks?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedTask>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', results: tasks });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        throw new NotFoundError({ error: 'Method not allowed' });
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not search CRM', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { taskService };
