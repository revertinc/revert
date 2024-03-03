import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { CommentService } from '../../generated/typescript/api/resources/ticket/resources/comment/service/CommentService';
import { LinearClient } from '@linear/sdk';
import { disunifyTicketObject, unifyObject } from '../../helpers/crm/transform';
import { UnifiedTicketComment } from '../../models/unified/ticketComment';
import { TicketStandardObjects } from '../../constants/common';

const objType = TicketStandardObjects.ticketComment;

const commentServiceTicket = new CommentService(
    {
        async getComment(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
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

                        const unifiedComment = await unifyObject<any, UnifiedTicketComment>({
                            obj: comment,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedComment,
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
                            throw new Error(
                                'taskId is required for fetching Jira comments. You can also pass taskKey to taskId.'
                            );
                        }
                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/rest/api/2/issue/${parsedFields.taskId}/comment/${commentId}`,
                            headers: {
                                Accept: 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });

                        const unifiedComment = await unifyObject<any, UnifiedTicketComment>({
                            obj: result.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedComment,
                        });
                        break;
                    }
                    case TP_ID.trello: {
                        res.send({
                            status: 'ok',
                            result: 'This endpoint is not supported by trello',
                        });
                        break;
                    }
                    case TP_ID.bitbucket: {
                        let parsedFields: any = fields ? JSON.parse(fields) : undefined;

                        if (!parsedFields.taskId || !parsedFields.repo || !parsedFields.workspace) {
                            throw new Error(
                                'taskId and "repo" and "workspace" are required for fetching Bitbucket comments and should be included in the "fields" parameter."repo" and "workspace" can either be slug or UUID.'
                            );
                        }
                        const result = await axios({
                            method: 'get',
                            url: `https://api.bitbucket.org/2.0/repositories/${parsedFields.workspace}/${parsedFields.repo}/issues/${parsedFields.taskId}/comments/${commentId}`,
                            headers: {
                                Accept: 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });

                        const unifiedComment = await unifyObject<any, UnifiedTicketComment>({
                            obj: result.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedComment,
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
                const account = res.locals.account;
                const fields: any = JSON.parse(req.query.fields as string);
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;

                if (!fields || (fields && !fields.taskId)) {
                    throw new NotFoundError({
                        error: 'The query parameter "taskId" is required and should be included in the "fields" parameter.',
                    });
                }

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
                            filter: {
                                issue: {
                                    id: {
                                        eq: fields.taskId,
                                    },
                                },
                            },
                        };

                        const comments = await linear.comments(variables);

                        const unifiedComments = await Promise.all(
                            comments.nodes.map(
                                async (comment: any) =>
                                    await unifyObject<any, UnifiedTicketComment>({
                                        obj: comment,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );

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
                            results: unifiedComments,
                        });
                        break;
                    }
                    case TP_ID.clickup: {
                        let result: any = await axios({
                            method: 'get',
                            url: `https://api.clickup.com/api/v2/task/${fields.taskId}/comment`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'Content-Type': 'application/json',
                            },
                        });
                        const unifiedComments = await Promise.all(
                            result.data.comments.map(
                                async (comment: any) =>
                                    await unifyObject<any, UnifiedTicketComment>({
                                        obj: comment,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );

                        res.send({
                            status: 'ok',
                            next: undefined,
                            previous: undefined,
                            results: unifiedComments,
                        });
                        break;
                    }
                    case TP_ID.jira: {
                        let pagingString = `${pageSize ? `&maxResults=${pageSize}` : ''}${
                            pageSize && cursor ? `&startAt=${cursor}` : ''
                        }`;

                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/rest/api/2/issue/${fields.taskId}/comment?${pagingString}`,
                            headers: {
                                Accept: 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });

                        const unifiedComments = await Promise.all(
                            result.data.comments.map(
                                async (comment: any) =>
                                    await unifyObject<any, UnifiedTicketComment>({
                                        obj: comment,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );

                        const limit = Number(result.data.maxResults);
                        const startAt = Number(result.data.startAt);
                        const total = Number(result.data.total);
                        const nextCursor = limit + startAt <= total ? String(limit + startAt) : undefined;
                        const previousCursor = startAt - limit >= 0 ? String(startAt - limit) : undefined;

                        res.send({
                            status: 'ok',
                            next: nextCursor,
                            previous: previousCursor,
                            results: unifiedComments,
                        });
                        break;
                    }
                    case TP_ID.trello: {
                        let pagingString = `${pageSize ? `&limit=${pageSize}` : ''}`;

                        if (cursor) {
                            pagingString = pagingString + `&before=${cursor}`;
                        }
                        let comments: any = await axios({
                            method: 'get',
                            url: `https://api.trello.com/1/cards/${fields.taskId}/actions?filter=commentCard&key=${connection.app_client_id}&token=${thirdPartyToken}&${pagingString}`,
                            headers: {
                                Accept: 'application/json',
                            },
                        });
                        comments = comments.data;

                        const nextCursor = pageSize ? `${comments[comments.length - 1].id}` : undefined;

                        const unifiedComments = await Promise.all(
                            comments.map(
                                async (comment: any) =>
                                    await unifyObject<any, UnifiedTicketComment>({
                                        obj: comment,
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
                            previous: undefined,
                            results: unifiedComments,
                        });
                        break;
                    }
                    case TP_ID.bitbucket: {
                        if (!fields || (fields && !fields.repo && !fields.workspace)) {
                            throw new NotFoundError({
                                error: 'The query parameters "repo" and "workspace" are required and should be included in the "fields" parameter."repo" and "workspace" can either be slug or UUID.',
                            });
                        }
                        const pagingString = `${cursor ? `page=${cursor}` : ''}`;
                        let result: any = await axios({
                            method: 'get',
                            url: `https://api.bitbucket.org/2.0/repositories/${fields.workspace}/${fields.repo}/issues/${fields.taskId}/comments/${pagingString}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });
                        const unifiedComments = await Promise.all(
                            result.data.values.map(
                                async (comment: any) =>
                                    await unifyObject<any, UnifiedTicketComment>({
                                        obj: comment,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );

                        const pageNumber = result.data?.next
                            ? cursor
                                ? (parseInt(cursor) + 1).toString()
                                : '1'
                            : undefined;

                        res.send({
                            status: 'ok',
                            next: pageNumber,
                            previous: undefined,
                            results: unifiedComments,
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
                let commentData: any = req.body as unknown as UnifiedTicketComment;
                const connection = res.locals.connection;
                const account = res.locals.account;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const fields: any = JSON.parse((req.query as any).fields as string);
                if (commentData && !commentData.taskId) {
                    throw new Error('The parameter "taskId" is required in request body.');
                }
                const comment: any = await disunifyTicketObject<UnifiedTicketComment>({
                    obj: commentData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                logInfo('Revert::CREATE COMMENT', connection.app?.env?.accountId, tenantId, comment);

                switch (thirdPartyId) {
                    case TP_ID.linear: {
                        const linear = new LinearClient({
                            accessToken: thirdPartyToken,
                        });

                        const result = await linear.createComment(comment);

                        res.send({
                            status: 'ok',
                            message: 'Linear Comment posted',
                            result: result,
                        });
                        break;
                    }
                    case TP_ID.clickup: {
                        const result: any = await axios({
                            method: 'post',
                            url: `https://api.clickup.com/api/v2/task/${commentData.taskId}/comment`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(comment),
                        });

                        res.send({
                            status: 'ok',
                            message: 'Clickup comment posted',
                            result: result.data,
                        });
                        break;
                    }
                    case TP_ID.jira: {
                        const result: any = await axios({
                            method: 'post',
                            url: `${connection.tp_account_url}/rest/api/2/issue/${commentData.taskId}/comment`,
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(comment),
                        });

                        res.send({
                            status: 'ok',
                            message: 'Jira comment posted',
                            result: result.data,
                        });
                        break;
                    }
                    case TP_ID.trello: {
                        const commentCreated = await axios({
                            method: 'post',
                            url: `https://api.trello.com/1/cards/${commentData.taskId}/actions/comments?text=${comment.data.text}&key=${connection.app_client_id}&token=${thirdPartyToken}`,
                            headers: {
                                Accept: 'application/json',
                            },
                        });

                        res.send({
                            status: 'ok',
                            message: 'Trello comment posted',
                            result: commentCreated.data,
                        });
                        break;
                    }
                    case TP_ID.bitbucket: {
                        if (!fields || (fields && !fields.repo && !fields.workspace)) {
                            throw new NotFoundError({
                                error: 'The query parameters "repo" and "workspace" are required and should be included in the "fields" parameter."repo" and "workspace" can either be slug or UUID.',
                            });
                        }
                        const result: any = await axios({
                            method: 'post',
                            url: `https://api.bitbucket.org/2.0/repositories/${fields.workspace}/${fields.repo}/issues/${commentData.taskId}/comments`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(comment),
                        });
                        res.send({ status: 'ok', message: 'Bitbucket comment posted', result: result.data });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not create comment', error.response);
                console.error('Could not create comment', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateComment(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const commentData: any = req.body as unknown as UnifiedTicketComment;
                const commentId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const fields: any = JSON.parse((req.query as any).fields as string);
                const comment: any = await disunifyTicketObject<UnifiedTicketComment>({
                    obj: commentData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                logInfo('REVERT::UPDATE COMMENT', connection.app?.env?.accountId, tenantId, comment);

                switch (thirdPartyId) {
                    case TP_ID.linear: {
                        const linear = new LinearClient({
                            accessToken: thirdPartyToken,
                        });

                        const commentCreated = await linear.updateComment(commentId, comment);

                        res.send({
                            status: 'ok',
                            message: 'Linear Comment Updated',
                            result: commentCreated,
                        });
                        break;
                    }
                    case TP_ID.clickup: {
                        const result: any = await axios({
                            method: 'put',
                            url: `https://api.clickup.com/api/v2/comment/${commentId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(comment),
                        });

                        res.send({
                            status: 'ok',
                            message: 'Clickup comment updated',
                            result: result.data,
                        });
                        break;
                    }
                    case TP_ID.jira: {
                        if (!commentData.taskId) {
                            throw new NotFoundError({
                                error: 'taskId is required in request body for updating Jira comment.',
                            });
                        }
                        const result: any = await axios({
                            method: 'put',
                            url: `${connection.tp_account_url}/rest/api/2/issue/${commentData.taskId}/comment/${commentId}`,
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(comment),
                        });
                        res.send({
                            status: 'ok',
                            message: 'Jira comment updated',
                            result: result.data,
                        });
                        break;
                    }
                    case TP_ID.trello: {
                        if (!commentData.taskId) {
                            throw new NotFoundError({
                                error: 'taskId is required in request body for updating trello comment.',
                            });
                        }
                        const result = await axios({
                            method: 'put',
                            url: `https://api.trello.com/1/cards/${commentData.taskId}/actions/${commentId}/comments?text=${comment.data.text}&key=${connection.app_client_id}&token=${thirdPartyToken}`,
                            headers: {
                                Accept: 'application/json',
                            },
                        });

                        res.send({
                            status: 'ok',
                            message: 'Trello comment updated',
                            result: result.data,
                        });
                        break;
                    }
                    case TP_ID.bitbucket: {
                        if (!fields || (fields && !fields.repo && !fields.workspace)) {
                            throw new NotFoundError({
                                error: 'The query parameters "repo" and "workspace" are required and should be included in the "fields" parameter."repo" and "workspace" can either be slug or UUID.',
                            });
                        }

                        if (!commentData.taskId) {
                            throw new NotFoundError({
                                error: 'taskId is required in request body for updating Bitbucket comment.',
                            });
                        }
                        const result = await axios({
                            method: 'put',
                            url: `https://api.bitbucket.org/2.0/repositories/${fields.workspace}/${fields.repo}/issues/${commentData.taskId}/comments/${commentId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(comment),
                        });

                        res.send({
                            status: 'ok',
                            message: 'Bitbucket comment updated',
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
                console.error('Could not update comment', error.response);
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
