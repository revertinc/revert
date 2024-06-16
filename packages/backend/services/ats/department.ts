import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { unifyObject } from '../../helpers/crm/transform';
import { UnifiedDepartment } from '../../models/unified/department';
import { DepartmentService } from '../../generated/typescript/api/resources/ats/resources/department/service/DepartmentService';
import { AtsStandardObjects } from '../../constants/common';

const objType = AtsStandardObjects.department;

const departmentServiceAts = new DepartmentService(
    {
        async getDepartment(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const departmentId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo(
                    'Revert::GET DEPARTMENT',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    departmentId
                );

                switch (thirdPartyId) {
                    case TP_ID.greenhouse: {
                        const apiToken = thirdPartyToken;
                        const credentials = Buffer.from(apiToken + ':').toString('base64');
                        const headers = {
                            Authorization: 'Basic ' + credentials,
                        };

                        const result = await axios({
                            method: 'get',
                            url: `https://harvest.greenhouse.io/v1/departments/${departmentId}`,
                            headers: headers,
                        });
                        const UnifiedDepartment: any = await unifyObject<any, UnifiedDepartment>({
                            obj: result.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: UnifiedDepartment,
                        });
                        break;
                    }
                    case TP_ID.lever: {
                        res.send({
                            status: 'ok',
                            result: 'This endpoint is currently not supported.',
                        });
                        break;
                    }

                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch department', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getDepartments(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                // const fields: any = JSON.parse(req.query.fields as string);
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;

                logInfo(
                    'Revert::GET ALL DEPARTMENTS',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken
                );

                switch (thirdPartyId) {
                    case TP_ID.greenhouse: {
                        const apiToken = thirdPartyToken;
                        const credentials = Buffer.from(apiToken + ':').toString('base64');
                        const headers = {
                            Authorization: 'Basic ' + credentials,
                        };

                        let pagingString = `${pageSize ? `&per_page=${pageSize}` : ''}${
                            pageSize && cursor ? `&page=${cursor}` : ''
                        }`;

                        const result = await axios({
                            method: 'get',
                            url: `https://harvest.greenhouse.io/v1/departments?${pagingString}`,
                            headers: headers,
                        });

                        const unifiedDepartments = await Promise.all(
                            result.data.map(async (department: any) => {
                                return await unifyObject<any, UnifiedDepartment>({
                                    obj: department,
                                    tpId: thirdPartyId,
                                    objType,
                                    tenantSchemaMappingId: connection.schema_mapping_id,
                                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                                });
                            })
                        );
                        const linkHeader = result.headers.link;
                        let nextCursor, previousCursor;
                        if (linkHeader) {
                            const links = linkHeader.split(',');

                            links?.forEach((link: any) => {
                                if (link.includes('rel="next"')) {
                                    nextCursor = Number(link.match(/[&?]page=(\d+)/)[1]);
                                } else if (link.includes('rel="prev"')) {
                                    previousCursor = Number(link.match(/[&?]page=(\d+)/)[1]);
                                }
                            });
                        }

                        res.send({
                            status: 'ok',
                            next: nextCursor ? String(nextCursor) : undefined,
                            previous: previousCursor !== undefined ? String(previousCursor) : undefined,
                            results: unifiedDepartments,
                        });

                        break;
                    }
                    case TP_ID.lever: {
                        const headers = { Authorization: `Bearer ${thirdPartyToken}` };

                        let pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&offset=${cursor}` : ''
                        }`;

                        const result = await axios({
                            method: 'get',
                            url: `https://api.lever.co/v1/tags?${pagingString}`,
                            headers: headers,
                        });

                        const unifiedDepartments = await Promise.all(
                            result.data.data.map(async (department: any) => {
                                return await unifyObject<any, UnifiedDepartment>({
                                    obj: department,
                                    tpId: thirdPartyId,
                                    objType,
                                    tenantSchemaMappingId: connection.schema_mapping_id,
                                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                                });
                            })
                        );
                        let nextCursor;

                        if (result.data.hasNext) {
                            nextCursor = result.data.next;
                        } else {
                            nextCursor = undefined;
                        }

                        res.send({
                            status: 'ok',
                            next: nextCursor,
                            previous: undefined,
                            results: unifiedDepartments,
                        });

                        break;
                    }

                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch departments', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { departmentServiceAts };
