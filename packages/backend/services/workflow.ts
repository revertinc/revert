import { Workflow } from '../models/workflow';
import { WorkflowNode } from '../models/workflowNode';
import { RegisteredApp } from '../models/registeredApp';
import cronService from './cron';
import { topologicalSort } from '../helpers/topologicalSort';
import { evalWithContext } from '../helpers/evaluators';
import {
    NODE_EXECUTION_TYPE,
    NODE_INTEGRATION_TYPE,
    NODE_TRIGGER_TYPE,
    NODE_TYPE,
    WorflowDeploymentStatus,
} from '../types';
import { IncomingHttpHeaders } from 'http';
import { requestPromise } from '../helpers/requestPromise';
import axios from 'axios';
import mongoose from 'mongoose';
import { Workspace } from '../models/workspace';
const { nanoid } = require('nanoid');

export const bakedRequest = async (context: any, request: any): Promise<any> => {
    const newRequest = request;
    newRequest.url = evalWithContext(context.result, JSON.stringify(newRequest.url), context.queryNames, false);

    if (newRequest.headers) {
        newRequest.headers = evalWithContext(
            context.result,
            JSON.stringify(newRequest.headers),
            context.queryNames,
            false
        );
    }
    if (newRequest.body) {
        newRequest.body = JSON.stringify(evalWithContext(context.result, newRequest.body, context.queryNames, false));
    }
    return await requestPromise(newRequest);
};

const intersection = (list1: any[], list2: any[]) => list1.filter((a) => list2.some((b) => a.id === b.id));

export const executeNode = async (workspaceId: string, node: any, input: any, queryNames: string[]) => {
    const nodeResult: any = { data: {}, status: undefined, error: undefined };
    const workspace = await Workspace.findOne({
        _id: workspaceId,
    });
    const oauth: any = {};
    workspace?.oauth.forEach((auth) => {
        if (auth.type === 'gsheet' || auth.type === 'gmail') {
            oauth[auth.type] = {};
            oauth[auth.type][auth.email] = {};
            oauth[auth.type][auth.email].access_token = auth.access_token;
        } else if (auth.type === 'slack') {
            oauth[auth.type] = {};
            oauth[auth.type][auth.team.id] = {};
            oauth[auth.type][auth.team.id].access_token = auth.access_token;
        }
    });

    input.helpers = {
        request: bakedRequest,
    };
    input.oauth = oauth;
    try {
        switch (node?.type) {
            case NODE_TYPE.CRON: {
                nodeResult.data = {
                    cronString: node.data?.cronString,
                    timeZone: node.data?.timeZone,
                };
                break;
            }
            case NODE_TYPE.WEBHOOK: {
                nodeResult.data = node.data?.webhook;
                break;
            }
            case NODE_TYPE.CODE_JS:
                {
                    nodeResult.data = evalWithContext(input, node!.data!.code!, queryNames);
                }
                break;
            case NODE_TYPE.API: {
                // TODO: Handle async execution.
                try {
                    const result = await bakedRequest({ result: input, queryNames: queryNames }, node!.data!.request);
                    nodeResult.data = result;
                } catch (error) {
                    console.log('error', error);
                    nodeResult.error = error;
                }
                break;
            }
            case NODE_TYPE.LOOP: {
                break;
            }
            case NODE_TYPE.NOOP: {
                break;
            }
            default: {
                if (node?.type && node.type in NODE_INTEGRATION_TYPE) {
                    const app = await RegisteredApp.findOne({
                        type: node!.type,
                        version: 'latest',
                    });
                    const functionName = node!.data!.functionName;
                    let resultPromise = eval(`
          (async () => {
            const module = () => { ${app!.module} return exports }
            const { ${functionName} : execute } = module();
            let context = ${JSON.stringify(input, (_, val) => {
                if (typeof val === 'function') {
                    return `(${val})`; // make it a string, surround it by parenthesis to ensure we can revive it as an anonymous function
                }
                return val;
            })};
            context.helpers.request = eval(context.helpers.request);
            const result = await (execute({
              context: context,
              data: ${JSON.stringify(
                  evalWithContext(input, JSON.stringify(node!.data!.integration), queryNames, false)
              )},
            }));
            return result;
          })()
        `);
                    const result = await resultPromise;
                    if (result.status === 'ok') {
                        nodeResult.data = result.data;
                    } else {
                        console.log('error', result.error);
                        nodeResult.error = result.error;
                    }
                } else {
                    console.error('Node type not recognized', node?.type);
                }
                break;
            }
        }
        return { response: nodeResult };
    } catch (error) {
        console.error('Node execution failed ', error);
        return { response: error };
    }
};

// TODO: Optimise this flow. Use a queue or a worker thread.
export const executeWorkflow = async (workflowId: string, data?: Object) => {
    const workflow = await Workflow.findOne({ id: workflowId });
    const workspaceId = new mongoose.Types.ObjectId(workflow!.workspaceId);
    const workspace = await Workspace.findOne({
        _id: workspaceId,
    });
    const oauth: any = {};
    workspace?.oauth.forEach((auth) => {
        if (auth.type === 'gsheet' || auth.type === 'gmail') {
            oauth[auth.type] = {};
            oauth[auth.type][auth.email] = {};
            oauth[auth.type][auth.email].access_token = auth.access_token;
        } else if (auth.type === 'slack') {
            oauth[auth.type] = {};
            oauth[auth.type][auth.team.id] = {};
            oauth[auth.type][auth.team.id].access_token = auth.access_token;
        }
    });

    let context: any = {
        executingNodeId: '',
        result: { _oauth: oauth },
        skippedNodes: [],
        queryNames: ['_oauth'],
        helpers: {
            request: bakedRequest,
        },
        oauth: oauth,
    };
    try {
        if (workflow?.deploymentStatus !== WorflowDeploymentStatus.Live) {
            console.warn('Workflow: ' + workflowId + ' is inactive, returning early.');
            return;
        }
        for (let i = 0; i < (workflow?.executionOrder || []).length; i++) {
            const nodeId: string = workflow?.executionOrder[i];
            const node = await WorkflowNode.findOne({ id: nodeId! });
            if (context.skippedNodes.includes(nodeId)) {
                if (node?.neighbors) {
                    // skip reachable nodes from this sourceNode.
                    context.skippedNodes.push(...node.neighbors);
                }
                // Skip nodes from earlier execution of nodes.
                continue;
            }
            context.executingNodeId = nodeId;
            context.prevNode = i - 1 >= 0 ? workflow?.executionOrder[i - 1] : null;
            context.result[node!.data!.label] = {};
            console.log('Executing node: ', nodeId, context);
            switch (node?.type) {
                case NODE_TYPE.CRON: {
                    context.result[node!.data!.label].data = {
                        cronString: node.data?.cronString,
                        timeZone: node.data?.timeZone,
                    };
                    break;
                }
                case NODE_TYPE.WEBHOOK: {
                    context.result[node!.data!.label].data = data;
                    break;
                }
                case NODE_TYPE.CODE_JS:
                    {
                        context.result[node!.data!.label].data = evalWithContext(
                            context.result,
                            node!.data!.code!,
                            context.queryNames
                        );
                    }
                    break;
                case NODE_TYPE.API: {
                    // TODO: Handle async execution.
                    try {
                        const result = await bakedRequest(context, node!.data!.request);
                        context.result[node!.data!.label].data = result;
                        context.result[node!.data!.label].status = 'ok';
                    } catch (error) {
                        console.log('error', error);
                        context.result[node!.data!.label].error = error;
                        context.result[node!.data!.label].status = 'error';
                    }
                    break;
                }
                case NODE_TYPE.BRANCH: {
                    const outputs = node?.data?.outputNodeIds!;
                    const conditions = node?.data?.conditions!;
                    // TODO: Single input only for now. Allow multiple inputs later.
                    let truthyConditionalIndex = conditions.findIndex((c) =>
                        evalWithContext(context.result, c, context.queryNames)
                    );
                    if (truthyConditionalIndex === -1 && conditions.length < outputs.length) {
                        // -- ELSE Block reached --
                        truthyConditionalIndex = conditions.length - 1;
                    }
                    console.log('Executing branch', truthyConditionalIndex);
                    if (truthyConditionalIndex === -1) {
                        console.log('Reached else block with no output edge, skipping every node');
                        context.skippedNodes.push(...outputs);
                        break;
                    }
                    const skippedOutputNodeIds: string[] = outputs.filter((_id, index) => {
                        return index !== truthyConditionalIndex;
                    });
                    context.skippedNodes.push(...skippedOutputNodeIds);
                    break;
                }
                case NODE_TYPE.LOOP: {
                    break;
                }
                case NODE_TYPE.NOOP: {
                    break;
                }
                default: {
                    if (node?.type && node.type in NODE_INTEGRATION_TYPE) {
                        const app = await RegisteredApp.findOne({
                            type: node!.type,
                            version: 'latest',
                        });
                        const functionName = node!.data!.functionName;
                        let resultPromise = eval(`
          (async () => {
            const module = () => { ${app!.module} return exports }
            const { ${functionName} : execute } = module();
            let context = ${JSON.stringify(context, (_, val) => {
                if (typeof val === 'function') {
                    return `(${val})`; // make it a string, surround it by parenthesis to ensure we can revive it as an anonymous function
                }
                return val;
            })};
            context.helpers.request = eval(context.helpers.request);
            const result = await (execute({
              context: context,
              data: ${JSON.stringify(
                  evalWithContext(context.result, JSON.stringify(node!.data!.integration), context.queryNames, false)
              )},
            }));
            return result;
          })()
        `);
                        const result = await resultPromise;
                        if (result.status === 'ok') {
                            context.result[node!.data!.label].data = result.data;
                        } else {
                            console.log('error', result.error);
                            context.result[node!.data!.label].error = result.error;
                        }
                        context.result[node!.data!.label].status = result.status;
                    } else {
                        console.error('Node type not recognized', node?.type);
                    }
                    break;
                }
            }
            context.queryNames.push(node!.data!.label); // store queryNames processed so far.
            console.log('Executed node: ', nodeId);
            if (process.env.NODE_ENV !== 'production') {
                console.log('Executed result: ', JSON.stringify(context));
            }
        }
    } catch (error: any) {
        console.error(
            'Uncaught exception while running workflow: ' + workflow?.id,
            error.toString(),
            JSON.stringify(context)
        );
        if (process.env.NODE_ENV === 'production') {
            axios
                .post('https://api.buildwithforest.com/workflow/trigger/71b190cd-workflowError', {
                    workflowId: workflow?.id,
                    error: error.toString(),
                })
                .catch((e) => console.error('Error sending workflow error alert', e));
        }
    }
};

export const sanitiseNodes = (nodesData: any) => {
    /* 
     1. Copy cron & JS as is.  ✅ 
     2. Copy webhook without headers & update path. ✅ 
     3. Copy Slack/ Gmail without OAuth. ✅ 
     4. Copy Api block without Auth data & headers. ✅ 
     5. Copy postgres without dbConfig & auth data. ✅ 
  */
    let sanitisedNodes: any = [];
    nodesData.forEach((node: any) => {
        if (
            node.type === NODE_INTEGRATION_TYPE.INTEGRATION_GMAIL ||
            node.type === NODE_INTEGRATION_TYPE.INTEGRATION_SLACK
        ) {
            node.data.integration.oauth = undefined;
        } else if (node.type === NODE_EXECUTION_TYPE.API) {
            node.data.headers = {
                'Content-Type': 'application/json',
            };
            node.data.request.authMethod = 'none';
            node.data.request.authData = {
                consumerKey: '<consumerKey>',
                consumerSecret: '<consumerSecret>',
                tokenKey: '<tokenKey>',
                tokenSecret: '<tokenSecret>',
            };
        } else if (node.type === NODE_TRIGGER_TYPE.WEBHOOK) {
            node.data.webhook.path = nanoid().toLowerCase();
            node.data.webhook.authData = {
                key: 'x-auth-key',
                value: 'webhook-secret',
                method: 'None',
            };
            node.data.webhook.headers = {
                key: 'value',
            };
        } else if (node.type === NODE_INTEGRATION_TYPE.INTEGRATION_POSTGRES) {
            let query = node.data.integration.query;
            node.data.integration = {
                dbConfig: {
                    nickName: 'customerDB',
                    host: 'testuserdatabase.jskjanmwb.us-east-2.rds.amazonaws.com',
                    port: 5432,
                    database: 'assdfsadf',
                },
                authData: {
                    user: 'dbUser',
                    password: 'verystrongpassword',
                },
                whitelistedIPs: ['1.0.0.1', '172.0.0.2'],
                query: query,
            };
        }
        sanitisedNodes.push(node);
    });
    return sanitisedNodes;
};
class WorkflowService {
    constructor() {}
    async createOrUpdate(data: any) {
        try {
            const workflowId = data.workflowId;
            const workspaceId = data.workspaceId;
            const workflowName = data.name;
            const existingWorkflow = await Workflow.findOne({ id: workflowId }).populate('nodes').exec();
            const orderOfExecution = topologicalSort(data.nodes, data.edges);
            const orderOfExecutionIds = orderOfExecution.map((n) => n.id);
            const rootNode = orderOfExecution[0]; // Assumption is that only one root node exists.
            if (!existingWorkflow) {
                const result = await WorkflowNode.insertMany([...orderOfExecution]);
                const nodeIds = result.map((n) => n._id);
                const rootNodeSaved = result.filter((n) => n.id === rootNode.id);
                const workflow = new Workflow({
                    name: workflowName,
                    id: workflowId,
                    rootNodeId: rootNodeSaved[0]?._id,
                    nodes: nodeIds,
                    nodesUi: data.nodes,
                    executionOrder: orderOfExecutionIds,
                    workspaceId: workspaceId,
                    edges: data.edges,
                    deploymentStatus: data.deploymentStatus ? data.deploymentStatus : WorflowDeploymentStatus.Live,
                });
                workflow.save();
                if (rootNode.data.cronString) {
                    try {
                        await cronService.create({
                            id: workflowId,
                            cron: rootNode.data.cronString,
                            tz: rootNode.data.timeZone,
                        });
                    } catch (error) {
                        console.log('Error creating cron for workflow:' + workflow.id, error);
                    }
                }
                return {
                    message: 'ok',
                    action: 'created',
                };
            } else {
                const result = await WorkflowNode.bulkWrite(
                    orderOfExecution.map((node: any) => ({
                        updateOne: {
                            filter: { id: node.id },
                            update: node,
                            upsert: true,
                        },
                    }))
                );

                const nodeIds = [
                    ...intersection(existingWorkflow.nodes, orderOfExecution).map((n) => n._id),
                    ...result.getUpsertedIds().map((n) => n._id),
                    ...result.getInsertedIds().map((n) => n._id),
                ];
                const newRoot = await WorkflowNode.findOne({
                    id: rootNode.id,
                });
                await Workflow.updateOne(
                    { id: workflowId },
                    {
                        $set: {
                            id: workflowId,
                            rootNodeId: newRoot!._id,
                            nodes: nodeIds,
                            nodesUi: data.nodes,
                            executionOrder: orderOfExecutionIds,
                            edges: data.edges,
                            name: workflowName,
                            env: data.env,
                            deploymentStatus: data.deploymentStatus,
                        },
                    }
                );
                const oldRoot = await WorkflowNode.findOne({
                    _id: existingWorkflow.rootNodeId,
                });
                //  Update cron service if root node has changed.
                if (oldRoot!.data?.cronString) {
                    if (rootNode.data.cronString) {
                        await cronService.update({
                            id: workflowId,
                            cron: rootNode.data.cronString,
                            tz: rootNode.data.timeZone,
                        });
                    } else {
                        await cronService.delete(workflowId);
                    }
                } else {
                    if (rootNode.data.cronString) {
                        try {
                            await cronService.create({
                                id: workflowId,
                                cron: rootNode.data.cronString,
                                tz: rootNode.data.timeZone,
                            });
                        } catch (error) {
                            console.log('Error creating cron for workflow:' + workflowId, error);
                        }
                    }
                }
                return {
                    message: 'ok',
                    action: 'edited',
                };
            }
        } catch (error) {
            console.log('Error creating/updating workflow', error);
            return {
                message: 'Could not save workflow',
                error: error,
            };
        }
    }
    async read(workflowId: string) {
        let result: any;
        try {
            const workflow = await Workflow.findOne({ id: workflowId });
            result = {
                data: workflow,
            };
        } catch (error) {
            result = {
                error: 'Error reading workflow' + error,
            };
        }
        return result;
    }

    async readAll(workspaceId: string) {
        let result: any;
        try {
            const workflow = await Workflow.find({ workspaceId: workspaceId });
            result = {
                data: workflow,
            };
        } catch (error) {
            result = {
                error: 'Error reading workflow' + error,
            };
        }
        return result;
    }

    async triggerDAG(workflowId: string, context?: any) {
        try {
            executeWorkflow(workflowId, context.data);
            return {
                message: 'Workflow trigger for id: ' + workflowId,
            };
        } catch (error) {
            console.log('Error occurred while executing workflow', workflowId, error);
            return {
                message: 'Error executing workflow',
                error: error,
            };
        }
    }

    async triggerWebhookWorkflow(headers: IncomingHttpHeaders, webhook: any, rootNode: any, incomingData: any) {
        if (webhook.authData) {
            const method = webhook.authData.method;
            const authData = webhook.authData;
            if (method === 'headerAuth') {
                if (headers[authData.key] !== authData.value) {
                    return {
                        message: 'Request not authenticated, workflow not triggered.',
                    };
                }
            }
        }
        let context = {
            data: incomingData,
            response: JSON.parse(webhook.response),
        };
        const triggered = await this.triggerWorkflowFromRoot(rootNode._id, context);
        if (triggered) {
            return context.response;
        } else
            return {
                error: 'Workflow not active',
            };
    }
    async triggerWorkflowFromRoot(rootNodeId: any, context: any) {
        const workflow = await Workflow.findOne({ rootNodeId: rootNodeId });
        if (workflow?.deploymentStatus !== WorflowDeploymentStatus.Live) {
            return false;
        }
        this.triggerDAG(workflow!.id, context);
        return true;
    }

    async updateDeploymentStatus(workflowId: string, status: WorflowDeploymentStatus) {
        await Workflow.findOneAndUpdate(
            { id: workflowId },
            {
                $set: {
                    deploymentStatus: status,
                },
            }
        );
        return {
            message: 'ok',
        };
    }

    async fork(workflowIdToFork: string, workspaceId: string) {
        let result: any;
        try {
            const workflow = await Workflow.findOne({ id: workflowIdToFork });
            if (!workflow) {
                result = {
                    message: `Workflow ${workflowIdToFork} does not exist`,
                };
                return result;
            }

            const nodes = sanitiseNodes(workflow.nodesUi);
            const edges = workflow.edges;
            const newWorkflowId = `ui-${workspaceId}-` + nanoid();
            await this.createOrUpdate({
                nodes: nodes,
                edges: edges,
                workflowId: newWorkflowId,
                workspaceId: workspaceId,
                name: workflow.name,
                deploymentStatus: WorflowDeploymentStatus.Paused,
            });
            result = {
                newWorkflowId: newWorkflowId,
                message: `Workflow ${workflowIdToFork} successfully forked to workspace ${workspaceId} as ${newWorkflowId}`,
            };
        } catch (error) {
            result = {
                message: `Workflow ${workflowIdToFork} couldnt be forked to ${workspaceId}`,
                error: 'Error reading workflow' + error,
            };
        }
        return result;
    }
}

export default new WorkflowService();
