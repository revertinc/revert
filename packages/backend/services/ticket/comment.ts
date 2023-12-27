import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { CommentService } from '../../generated/typescript/api/resources/ticket/resources/comment/service/CommentService';
import { LinearClient } from '@linear/sdk';

const commentServiceTicket = new CommentService(
    {
        async getComment(req, res) {
            try {
                const connection = res.locals.connection;
                // const account = res.locals.account;
                const fields: any = req.query.fields;
                const commentId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo(
                    'Revert::GET COMMENT',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    commentId
                );

                switch (thirdPartyId) {
                    case TP_ID.linear: {
                        const linear = new LinearClient({
                            accessToken: thirdPartyToken,
                        });

                        const comment = await linear.comment(commentId);

                        res.send({
                            status: 'ok',
                            result: comment,
                        });
                        break;
                    }
                    case TP_ID.clickup: {
                        res.send({
                            status: 'ok',
                            result: 'This endpoint is not supported by clickup',
                        });
                        break;
                    }
                    case TP_ID.jira: {
                        let parsedFields: any = fields ? JSON.parse(fields) : undefined;
                        if (!parsedFields.taskId) {
                            throw new Error('Issue Id or Issue key required for fetching comments');
                        }
                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/rest/api/2/issue/${parsedFields.taskId}/comment/${commentId}`,
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
                console.error('Could not fetch comment', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },

        async getComments(req, res) {
            try {
                const connection = res.locals.connection;
                // const account = res.locals.account;
                const fields: any = req.query.fields;
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo(
                    'Revert::GET ALL COMMENTS',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken
                );

                switch (thirdPartyId) {
                    case TP_ID.linear: {
                        const linear = new LinearClient({
                            accessToken: thirdPartyToken,
                        });

                        const variables = {
                            first: pageSize ? pageSize : null,
                            after: cursor ? cursor : null,
                            last: null,
                            Before: null,
                        };

                        const comments = await linear.comments(variables);

                        const pageInfo = comments.pageInfo;
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
                            results: comments.nodes,
                        });
                        break;
                    }
                    case TP_ID.clickup: {
                        let parsedFields: any = fields ? JSON.parse(fields) : undefined;
                        let result: any = await axios({
                            method: 'get',
                            url: `https://api.clickup.com/api/v2/${parsedFields.entity}/${parsedFields.entityId}/comment`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        res.send({
                            status: 'ok',
                            next: undefined,
                            previous: undefined,
                            results: result.data.comments,
                        });
                        break;
                    }
                    case TP_ID.jira: {
                        let parsedFields: any = fields ? JSON.parse(fields) : undefined;
                        if (!parsedFields.taskId) {
                            throw new Error('Issue Id or Issue key required for fetching comments');
                        }
                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/rest/api/2/issue/${parsedFields.taskId}/comment`,
                            headers: {
                                Accept: 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        res.send({
                            status: 'ok',
                            next: undefined,
                            previous: undefined,
                            results: result.data,
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch comments', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },

        async createComment(req, res) {
            try {
                let commentData: any = req.body;
                const connection = res.locals.connection;
                // const account = res.locals.account;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo('Revert::CREATE COMMENT', connection.app?.env?.accountId, tenantId, commentData);

                switch (thirdPartyId) {
                    case TP_ID.linear: {
                        const linear = new LinearClient({
                            accessToken: thirdPartyToken,
                        });

                        const comment = await linear.createComment(commentData);

                        res.send({
                            status: 'ok',
                            message: 'Linear Comment posted',
                            result: comment,
                        });
                        break;
                    }
                    case TP_ID.clickup: {
                        const fields = commentData.fields;
                        delete commentData.fields;
                        const result: any = await axios({
                            method: 'post',
                            url: `https://api.clickup.com/api/v2/${fields.entity}/${fields.entityId}/comment`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(commentData),
                        });

                        res.send({
                            status: 'ok',
                            message: 'Clickup comment posted',
                            result: result.data,
                        });
                        break;
                    }
                    case TP_ID.jira: {
                        const fields = commentData.fields;
                        delete commentData.fields;

                        const result: any = await axios({
                            method: 'post',
                            url: `${connection.tp_account_url}/rest/api/2/issue/${fields.issueId}/comment`,
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(commentData),
                        });

                        res.send({
                            status: 'ok',
                            message: 'Jira comment posted',
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
                console.error('Could not create comment', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { commentServiceTicket };
