import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { CollectionService } from '../../generated/typescript/api/resources/ticket/resources/collection/service/CollectionService';
import { TP_ID } from '@prisma/client';
import { LinearClient } from '@linear/sdk';
import axios from 'axios';

const collectionServiceTicket = new CollectionService(
    {
        async getCollections(req, res) {
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
                    'Revert::GET ALL COLLECTIONS',
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

                        let parsedFields: any = fields ? JSON.parse(fields) : undefined;

                        const pagination = {
                            first: pageSize ? pageSize : null,
                            after: cursor ? cursor : null,
                        };

                        let result: any;
                        let pageInfo: any;

                        if (parsedFields && parsedFields.collection_type === 'list') {
                            throw new Error('Linear does not support for collection_type list');
                        } else if (parsedFields && parsedFields.collection_type === 'project') {
                            result = await linear.projects(pagination);
                            pageInfo = result.pageInfo;
                            result = result.nodes;
                        } else if (parsedFields && parsedFields.collection_type === 'space') {
                            throw new Error('Linear does not support for collection_type space');
                        } else if (parsedFields && parsedFields.collection_type === 'team') {
                            result = await linear.teams(pagination);
                            pageInfo = result.pageInfo;
                            result = result.nodes;
                        } else {
                            throw new Error(
                                "To use this endpoint, please specify the type of collection you're working with. Valid options include: 'list', 'folder', 'space', or 'team'."
                            );
                        }

                        let next_cursor = undefined;
                        if (pageInfo && pageInfo.hasNextPage && pageInfo.endCursor) {
                            next_cursor = pageInfo.endCursor;
                        }

                        let previous_cursor = undefined;
                        if (pageInfo && pageInfo.hasPreviousPage && pageInfo.startCursor) {
                            previous_cursor = pageInfo.startCursor;
                        }

                        res.send({
                            status: 'ok',
                            next: next_cursor,
                            previous: previous_cursor,
                            results: result,
                        });
                        break;
                    }
                    case TP_ID.clickup: {
                        let parsedFields: any = fields ? JSON.parse(fields) : undefined;
                        const pagingString = `${cursor ? `page=${cursor}` : ''}`;
                        let result: any;
                        let pageNumber: any;
                        if (parsedFields && parsedFields.collection_type === 'list') {
                            if (!parsedFields.folderId) {
                                throw new Error(
                                    "To retrieve all lists in Clickup, folderId is required. Please set collection_type to 'folder' to verify."
                                );
                            }
                            result = await axios({
                                method: 'get',
                                url: `https://api.clickup.com/api/v2/folder/${parsedFields.folderId}/list?archived=false&${pagingString}`,
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                    'Content-Type': 'application/json',
                                },
                            });
                            pageNumber = !result.data?.last_page
                                ? cursor
                                    ? (parseInt(String(cursor)) + 1).toString()
                                    : '1'
                                : undefined;
                            result = result.data.lists;
                        } else if (parsedFields && parsedFields.collection_type === 'folder') {
                            if (!parsedFields.spaceId) {
                                throw new Error(
                                    "To retrieve all folders in Clickup, spaceId is required. Please set collection_type to 'space' to verify."
                                );
                            }
                            result = await axios({
                                method: 'get',
                                url: `https://api.clickup.com/api/v2/space/${parsedFields.spaceId}/folder?archived=false&${pagingString}`,
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                    'Content-Type': 'application/json',
                                },
                            });
                            pageNumber = !result.data?.last_page
                                ? cursor
                                    ? (parseInt(String(cursor)) + 1).toString()
                                    : '1'
                                : undefined;
                            result = result.data.folders;
                        } else if (parsedFields && parsedFields.collection_type === 'space') {
                            if (!parsedFields.teamId) {
                                throw new Error(
                                    "To retrieve all folders in Clickup, teamId is required. Please set collection_type to 'team' to verify."
                                );
                            }
                            result = await axios({
                                method: 'get',
                                url: `https://api.clickup.com/api/v2/team/${parsedFields.teamId}/space?archived=false&${pagingString}`,
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                    'Content-Type': 'application/json',
                                },
                            });
                            pageNumber = !result.data?.last_page
                                ? cursor
                                    ? (parseInt(String(cursor)) + 1).toString()
                                    : '1'
                                : undefined;
                            result = result.data.spaces;
                        } else if (parsedFields && parsedFields.collection_type === 'team') {
                            result = await axios({
                                method: 'get',
                                url: `https://api.clickup.com/api/v2/team?${pagingString}`,
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                    'Content-Type': 'application/json',
                                },
                            });
                            pageNumber = !result.data?.last_page
                                ? cursor
                                    ? (parseInt(String(cursor)) + 1).toString()
                                    : '1'
                                : undefined;
                            result = result.data.teams;
                        } else {
                            throw new Error(
                                "To use this endpoint, please specify the type of collection you're working with. Valid options include: 'list', 'folder', 'space', or 'team'."
                            );
                        }

                        res.send({
                            status: 'ok',
                            next: pageNumber,
                            previous: undefined,
                            results: result,
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch lists', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { collectionServiceTicket };
