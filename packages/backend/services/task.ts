import axios from 'axios';
import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { disunifyTask, unifyTask } from '../models/unified';
import { ParsedQs } from 'qs';

class TaskService {
    async getUnifiedTask(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const taskId = req.params.id;
        const fields = req.query.fields;
        console.log('Revert::GET TASK', tenantId, thirdPartyId, thirdPartyToken, taskId);
        if (thirdPartyId === 'hubspot') {
            let task: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/tasks/${taskId}?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            task = ([task.data] as any[])?.[0];
            task = unifyTask({ ...task, ...task?.properties });
            return {
                result: task,
            };
        } else if (thirdPartyId === 'zohocrm') {
            const tasks = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Tasks/${taskId}?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            let task = unifyTask(tasks.data.data?.[0]);
            return { result: task };
        } else if (thirdPartyId === 'sfdc') {
            const tasks = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Task/${taskId}`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            let task = unifyTask(tasks.data);
            return { result: task };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async getUnifiedTasks(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const fields = req.query.fields;
        console.log('Revert::GET ALL TASK', tenantId, thirdPartyId, thirdPartyToken);
        if (thirdPartyId === 'hubspot') {
            let tasks: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/tasks?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            tasks = tasks.data.results as any[];
            tasks = tasks?.map((l: any) => unifyTask({ ...l, ...l?.properties }));
            return {
                results: tasks,
            };
        } else if (thirdPartyId === 'zohocrm') {
            let tasks: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Tasks?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            tasks = tasks.data.data;
            tasks = tasks?.map((l: any) => unifyTask(l));
            return { results: tasks };
        } else if (thirdPartyId === 'sfdc') {
            // TODO: Handle "ALL" for Hubspot & Zoho
            const query =
                fields === 'ALL'
                    ? 'SELECT+fields(all)+from+Task+limit+200'
                    : `SELECT+${(fields as string).split(',').join('+,+')}+from+Task`;
            let tasks: any = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/query/?q=${query}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            tasks = tasks.data?.records;
            tasks = tasks?.map((l: any) => unifyTask(l));
            return { results: tasks };
        } else {
            return { error: 'Unrecognized CRM' };
        }
    }
    async searchUnifiedTasks(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const searchCriteria = req.body.searchCriteria;
        const fields = String(req.query.fields || '').split(',');
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
                    properties: ['hs_task_status', 'firstname', 'email', 'lastname', 'hs_object_id', ...fields],
                }),
            });
            tasks = tasks.data.results as any[];
            tasks = tasks?.map((l: any) => unifyTask({ ...l, ...l?.properties }));
            return {
                status: 'ok',
                results: tasks,
            };
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
            return { status: 'ok', results: tasks };
        } else if (thirdPartyId === 'sfdc') {
            let tasks: any = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/search?q=${searchCriteria}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            tasks = tasks?.data?.searchRecords;
            tasks = tasks?.map((l: any) => unifyTask(l));
            return { status: 'ok', results: tasks };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async createTask(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const task = disunifyTask(req.body, thirdPartyId);
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
            return {
                status: 'ok',
                message: 'Hubspot task created',
                result: task,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'post',
                url: `https://www.zohoapis.com/crm/v3/Tasks`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(task),
            });
            return { status: 'ok', message: 'Zoho task created', result: task };
        } else if (thirdPartyId === 'sfdc') {
            const taskCreated = await axios({
                method: 'post',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Task/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(task),
            });
            return {
                status: 'ok',
                message: 'SFDC task created',
                result: taskCreated.data,
            };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async updateTask(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const task = disunifyTask(req.body, thirdPartyId);
        const taskId = req.params.id;
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
            return {
                status: 'ok',
                message: 'Hubspot task created',
                result: task,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'put',
                url: `https://www.zohoapis.com/crm/v3/Tasks/${taskId}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(task),
            });
            return { status: 'ok', message: 'Zoho task updated', result: task };
        } else if (thirdPartyId === 'sfdc') {
            await axios({
                method: 'patch',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Task/${taskId}`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(task),
            });
            return { status: 'ok', message: 'SFDC task updated', result: task };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
}

export default new TaskService();
