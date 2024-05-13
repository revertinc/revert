import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { AtsStandardObjects } from 'constants/common';
import { unifyObject } from 'helpers/crm/transform';
import { UnifiedJob } from 'models/unified/job';

const objType = AtsStandardObjects.jobs;

const jobServiceAts = new JobService(
    {
        async getJob(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const jobId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo(
                    'Revert::GET JOB',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    jobId
                );

                switch (thirdPartyId) {
                    case TP_ID.workable: {
                        const result = await axios({
                            method: 'get',
                            url: ` ${connection.tp_account_url}/spi/v3/jobs/${jobId}`, //jobId param for workable is "shortcode" and not "id"
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });

                        const unifiedJob: any = await unifyObject<any, UnifiedJob>({
                            obj: result.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedJob,
                        });
                        break;
                    }

                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch job', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getJobs(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const fields: any = JSON.parse(req.query.fields as string);
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;

                logInfo(
                    'Revert::GET ALL JOBS',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken
                );

                switch (thirdPartyId) {
                    case TP_ID.workable: {
                        let pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&since_id=${cursor}` : ''
                        }`;
                        const additionalParamsString = Object.keys(fields)
                            .map((key) => `${key}=${fields[key]}`)
                            .join('&');

                        const otherParams = additionalParamsString ? `&${additionalParamsString}` : '';

                        const result = await axios({
                            method: 'get',
                            url: ` ${connection.tp_account_url}/spi/v3/jobs?${otherParams}${pagingString}`,
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });

                        const unifiedJobs = await Promise.all(
                            result.data.jobs.map(async (job: any) => {
                                return await unifyObject<any, UnifiedJob>({
                                    obj: job,
                                    tpId: thirdPartyId,
                                    objType,
                                    tenantSchemaMappingId: connection.schema_mapping_id,
                                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                                });
                            })
                        );

                        const sinceIdMatch = result.data?.paging?.next.match(/[?&]since_id=([^&]+)/);

                        const nextCursor = sinceIdMatch ? sinceIdMatch[1] : undefined;
                        const previousCursor = undefined;

                        res.send({
                            status: 'ok',
                            next: nextCursor,
                            previous: previousCursor,
                            results: unifiedJobs,
                        });

                        break;
                    }

                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch jobs', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { jobServiceAts };
