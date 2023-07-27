import axios from 'axios';

import { TaskService } from '../../generated/typescript/api/resources/crm/resources/task/service/TaskService';
import { InternalServerError } from '../../generated/typescript/api/resources/common';
import { NotFoundError } from '../../generated/typescript/api/resources/common';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import revertAuthMiddleware from '../../helpers/authMiddleware';
import logError from '../../helpers/logError';
import { UnifiedTask, disunifyTask, unifyTask } from '../../models/unified';

const taskService = new TaskService(
    {
        async getUnifiedTask(req, res) {
            try {
                const connection = res.locals.connection;
                const taskId = req.params.id;
                const fields = req.query.fields;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::GET TASK', tenantId, thirdPartyId, thirdPartyToken, taskId);
                if (thirdPartyId === 'hubspot') {
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
                    task = unifyTask({ ...task, ...task?.properties });
                    res.send({ status: 'ok', result: task });
                } else if (thirdPartyId === 'zohocrm') {
                    const tasks = await axios({
                        method: 'get',
                        url: `https://www.zohoapis.com/crm/v3/Tasks/${taskId}?fields=${fields}`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                    });
                    let task = unifyTask(tasks.data.data?.[0]);
                    res.send({ status: 'ok', result: task });
                } else if (thirdPartyId === 'sfdc') {
                    const instanceUrl = connection.tp_account_url;
                    const tasks = await axios({
                        method: 'get',
                        url: `${instanceUrl}/services/data/v56.0/sobjects/Task/${taskId}`,
                        headers: {
                            Authorization: `Bearer ${thirdPartyToken}`,
                        },
                    });
                    let task = unifyTask(tasks.data);
                    res.send({ status: 'ok', result: task });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch lead', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getUnifiedTasks(req, res) {
            try {
                const connection = res.locals.connection;
                const fields = req.query.fields;
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::GET ALL TASK', tenantId, thirdPartyId, thirdPartyToken);
                if (thirdPartyId === 'hubspot') {
                    const formattedFields = [
                        ...String(fields || '').split(','),
                        'hs_task_body',
                        'hs_task_subject',
                        'hs_task_priority',
                        'hs_task_status',
                        'hs_timestamp',
                    ];
                    const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${cursor ? `&after=${cursor}` : ''}`;
                    let tasks: any = await axios({
                        method: 'get',
                        url: `https://api.hubapi.com/crm/v3/objects/tasks?properties=${formattedFields}&${pagingString}`,
                        headers: {
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                    });
                    const nextCursor = tasks.data?.paging?.next?.after || undefined;
                    tasks = tasks.data.results as any[];
                    tasks = tasks?.map((l: any) => unifyTask({ ...l, ...l?.properties }));
                    res.send({
                        status: 'ok',
                        next: nextCursor,
                        previous: undefined, // Field not supported by Hubspot.
                        results: tasks,
                    });
                } else if (thirdPartyId === 'zohocrm') {
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
                    tasks = tasks?.map((l: any) => unifyTask(l));
                    res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: tasks });
                } else if (thirdPartyId === 'sfdc') {
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
                    tasks = tasks?.map((l: any) => unifyTask(l));
                    res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: tasks });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch leads', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createTask(req, res) {
            try {
                const taskData = req.body as UnifiedTask;
                const connection = res.locals.connection;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const task = disunifyTask(taskData, thirdPartyId);
                console.log('Revert::CREATE TASK', tenantId, task);
                if (thirdPartyId === 'hubspot') {
                    await axios({
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
                        result: task,
                    });
                } else if (thirdPartyId === 'zohocrm') {
                    await axios({
                        method: 'post',
                        url: `https://www.zohoapis.com/crm/v3/Tasks`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                        data: JSON.stringify(task),
                    });
                    res.send({ status: 'ok', message: 'Zoho task created', result: task });
                } else if (thirdPartyId === 'sfdc') {
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
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not create lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateTask(req, res) {
            try {
                const connection = res.locals.connection;
                const taskData = req.body as UnifiedTask;
                const taskId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const task = disunifyTask(taskData, thirdPartyId);
                console.log('Revert::UPDATE TASK', tenantId, task, taskId);
                if (thirdPartyId === 'hubspot') {
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
                } else if (thirdPartyId === 'zohocrm') {
                    await axios({
                        method: 'put',
                        url: `https://www.zohoapis.com/crm/v3/Tasks/${taskId}`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                        data: JSON.stringify(task),
                    });
                    res.send({ status: 'ok', message: 'Zoho task updated', result: task });
                } else if (thirdPartyId === 'sfdc') {
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
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not update lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async searchTasks(req, res) {
            try {
                const connection = res.locals.connection;
                const fields = req.query.fields;
                const searchCriteria: any = req.body.searchCriteria;
                const formattedFields = (fields || '').split('').filter(Boolean);
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::SEARCH TASK', tenantId, searchCriteria, fields);
                if (thirdPartyId === 'hubspot') {
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
                    tasks = tasks?.map((l: any) => unifyTask({ ...l, ...l?.properties }));
                    res.send({
                        status: 'ok',
                        results: tasks,
                    });
                } else if (thirdPartyId === 'zohocrm') {
                    let tasks: any = await axios({
                        method: 'get',
                        url: `https://www.zohoapis.com/crm/v3/Tasks/search?criteria=${searchCriteria}`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                    });
                    tasks = tasks.data.data;
                    tasks = tasks?.map((l: any) => unifyTask(l));
                    res.send({ status: 'ok', results: tasks });
                } else if (thirdPartyId === 'sfdc') {
                    const instanceUrl = connection.tp_account_url;
                    let tasks: any = await axios({
                        method: 'get',
                        url: `${instanceUrl}/services/data/v56.0/search?q=${searchCriteria}`,
                        headers: {
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                    });
                    tasks = tasks?.data?.searchRecords;
                    tasks = tasks?.map((l: any) => unifyTask(l));
                    res.send({ status: 'ok', results: tasks });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not search CRM', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { taskService };
