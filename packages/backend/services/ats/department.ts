import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { AtsStandardObjects } from 'constants/common';
import { unifyObject } from 'helpers/crm/transform';
import { UnifiedDepartment } from 'models/unified/department';

const objType = AtsStandardObjects.departments;

const departmentServiceAts = new DepartmentService(
    {
        async getDepartment(req, res) {
            try {
                const connection = res.locals.connection;
                // const account = res.locals.account;
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
                    case TP_ID.workable: {
                        res.send({
                            status: 'ok',
                            results: 'This endpoint is currently not supported.',
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
                // const pageSize = parseInt(String(req.query.pageSize));
                // const cursor = req.query.cursor;
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
                    case TP_ID.workable: {
                        //PAGINATION is NOT yet supported for this endpoint in workable.

                        // let pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                        //     cursor ? `&since_id=${cursor}` : ''
                        // }`;
                        // const additionalParamsString = Object.keys(fields)
                        //     .map((key) => `${key}=${fields[key]}`)
                        //     .join('&');

                        // const otherParams = additionalParamsString ? `&${additionalParamsString}` : '';

                        const result = await axios({
                            method: 'get',
                            url: ` ${connection.tp_account_url}/spi/v3/departments`,
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
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

                        // const sinceIdMatch = result.data?.paging?.next.match(/[?&]since_id=([^&]+)/);

                        // const nextCursor = sinceIdMatch ? sinceIdMatch[1] : undefined;
                        // const previousCursor = undefined;

                        res.send({
                            status: 'ok',
                            // next: nextCursor,
                            // previous: previousCursor,
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
