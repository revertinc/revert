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
                        let parsedFields: any = fields ? JSON.parse(fields) : undefined;
                        let result: any = await axios({
                            method: 'get',
                            url: `https://api.clickup.com/api/v2/${parsedFields.entity}/${parsedFields.entityId}/comment`,
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
                    case TP_ID.trello: {
                        let parsedFields: any = fields ? JSON.parse(fields) : undefined;
                        if (!parsedFields.boardId) {
                            throw new Error('boardId is required');
                        }

                        let pagingString = `${pageSize ? `&limit=${pageSize}` : ''}`;

                        if (cursor?.startsWith('next_')) {
                            const sinceCursor = cursor.substring(5);
                            pagingString = pagingString + `&since=${sinceCursor}`;
                        } else if (cursor?.startsWith('prev_')) {
                            const beforeCursor = cursor.substring(5);
                            pagingString = pagingString + `&before=${beforeCursor}`;
                        }

                        let comments: any = await axios({
                            method: 'get',
                            url: `https://api.trello.com/1/boards/${parsedFields.boardId}/actions?filter=commentCard&key=${connection.app_client_id}&token=${thirdPartyToken}&${pagingString}`,
                            headers: {
                                Accept: 'application/json',
                            },
                        });
                        comments = comments.data;

                        const nextCursor = `next_${comments[comments.length - 1].id}`;
                        const previousCursor = `prev_${comments[0].id}`;

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
                            previous: previousCursor,
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
                let commentData: any = req.body;
                const connection = res.locals.connection;
                const account = res.locals.account;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
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
                            url: `https://api.clickup.com/api/v2/${comment.entity}/${comment.entityId}/comment`,
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
                            url: `${connection.tp_account_url}/rest/api/2/issue/${comment.issueId}/comment`,
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
                            url: `https://api.trello.com/1/cards/${comment.cardId}/actions/comments?text=${comment.data.text}&key=${connection.app_client_id}&token=${thirdPartyToken}`,
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
