import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { AtsStandardObjects } from '../../constants/common';
import { unifyObject } from '../../helpers/crm/transform';
import { UnifiedJob } from '../../models/unified/job';
import { JobService } from '../../generated/typescript/api/resources/ats/resources/job/service/JobService';

const objType = AtsStandardObjects.job;

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
                    case TP_ID.greenhouse: {
                        const apiToken = thirdPartyToken;
                        const credentials = Buffer.from(apiToken + ':').toString('base64');
                        const headers = {
                            Authorization: 'Basic ' + credentials,
                        };

                        const result = await axios({
                            method: 'get',
                            url: `https://harvest.greenhouse.io/v1/jobs/${jobId}`,
                            headers: headers,
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
                    case TP_ID.lever: {
                        const headers = { Authorization: `Bearer ${thirdPartyToken}` };
                        const result = await axios({
                            method: 'get',
                            url: `https://api.lever.co/v1/postings/${jobId}`,
                            headers: headers,
                        });

                        const unifiedJob: any = await unifyObject<any, UnifiedJob>({
                            obj: result.data.data,
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
                const fields: any = req.query.fields && JSON.parse(req.query.fields as string);

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
                    case TP_ID.greenhouse: {
                        const apiToken = thirdPartyToken;
                        const credentials = Buffer.from(apiToken + ':').toString('base64');
                        const headers = {
                            Authorization: 'Basic ' + credentials,
                        };

                        let otherParams = '';
                        if (fields) {
                            otherParams = Object.keys(fields)
                                .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(fields[key])}`)
                                .join('&');
                        }

                        let pagingString = `${pageSize ? `&per_page=${pageSize}` : ''}${
                            pageSize && cursor ? `&page=${cursor}` : ''
                        }${otherParams ? `&${otherParams}` : ''}`;

                        const result = await axios({
                            method: 'get',
                            url: `https://harvest.greenhouse.io/v1/jobs?${pagingString}`,
                            headers: headers,
                        });

                        const unifiedJobs = await Promise.all(
                            result.data.map(async (job: any) => {
                                return await unifyObject<any, UnifiedJob>({
                                    obj: job,
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
                            results: unifiedJobs,
                        });

                        break;
                    }
                    case TP_ID.lever: {
                        const headers = { Authorization: `Bearer ${thirdPartyToken}` };

                        let otherParams = '';
                        if (fields) {
                            otherParams = Object.keys(fields)
                                .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(fields[key])}`)
                                .join('&');
                        }

                        let pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&offset=${cursor}` : ''
                        }${otherParams ? `&${otherParams}` : ''}`;

                        const result = await axios({
                            method: 'get',
                            url: `https://api.lever.co/v1/postings?${pagingString}`,
                            headers: headers,
                        });

                        const unifiedJobs = await Promise.all(
                            result.data.data.map(async (job: any) => {
                                return await unifyObject<any, UnifiedJob>({
                                    obj: job,
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
        async createJob(req, res) {
            try {
                const jobData: any = req.body as unknown as UnifiedJob;
                const connection = res.locals.connection;
                const account = res.locals.account;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const fields: any = req.query.fields && JSON.parse((req.query as any).fields as string);

                const job: any = await disunifyAtsObject<UnifiedJob>({
                    obj: jobData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });

                logInfo('Revert::CREATE JOB', connection.app?.env?.accountId, tenantId, job);

                switch (thirdPartyId) {
                    case TP_ID.greenhouse: {
                        if (!fields || (fields && !fields.onBehalfOf)) {
                            throw new NotFoundError({
                                error: 'The query parameter "onBehalfOf",which is a greenhouseUser Id, is required and should be included in the "fields" parameter.',
                            });
                        }
                        const apiToken = thirdPartyToken;
                        const credentials = Buffer.from(apiToken + ':').toString('base64');

                        const result: any = await axios({
                            method: 'post',
                            url: `https://harvest.greenhouse.io/v1/jobs`,
                            headers: {
                                Authorization: 'Basic ' + credentials,
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                'On-Behalf-Of': `${fields.onBehalfOf}`,
                            },
                            data: JSON.stringify(job),
                        });
                        res.send({ status: 'ok', message: 'Greenhouse job created', result: result.data });

                        break;
                    }
                    case TP_ID.lever: {
                        if (!fields || (fields && !fields.perform_as)) {
                            throw new NotFoundError({
                                error: 'The query parameter "perform_as", is required and should be included in the "fields" parameter.',
                            });
                        }
                        const headers = {
                            Authorization: `Bearer ${thirdPartyToken}`,
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                        };
                        const result = await axios({
                            method: 'post',
                            url: `https://api.lever.co/v1/postings/?perform_as=${fields.perform_as}`,
                            headers: headers,
                            data: JSON.stringify(job),
                        });

                        res.send({
                            status: 'ok',
                            message: 'Lever job created',
                            result: result.data.data,
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not create job', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateJob(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const jobData = req.body as unknown as UnifiedJob;
                const jobId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const fields: any = req.query.fields && JSON.parse((req.query as any).fields as string);

                const job: any = await disunifyAtsObject<UnifiedJob>({
                    obj: jobData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                logInfo('Revert::UPDATE JOB', connection.app?.env?.accountId, tenantId, jobData);

                switch (thirdPartyId) {
                    case TP_ID.greenhouse: {
                        if (!fields || (fields && !fields.onBehalfOf)) {
                            throw new NotFoundError({
                                error: 'The query parameter "onBehalfOf",which is a greenhouseUser Id, is required and should be included in the "fields" parameter.',
                            });
                        }
                        const apiToken = thirdPartyToken;
                        const credentials = Buffer.from(apiToken + ':').toString('base64');

                        const result = await axios({
                            method: 'patch',
                            url: `https://harvest.greenhouse.io/v1/jobs/${jobId}`,
                            headers: {
                                Authorization: 'Basic ' + credentials,
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                'On-Behalf-Of': `${fields.onBehalfOf}`,
                            },
                            data: JSON.stringify(job),
                        });

                        res.send({
                            status: 'ok',
                            message: 'Greenhouse job updated',
                            result: result.data,
                        });

                        break;
                    }
                    case TP_ID.lever: {
                        if (!fields || (fields && !fields.perform_as)) {
                            throw new NotFoundError({
                                error: 'The query parameter "perform_as", is required and should be included in the "fields" parameter.',
                            });
                        }
                        const headers = {
                            Authorization: `Bearer ${thirdPartyToken}`,
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                        };
                        const result = await axios({
                            method: 'post',
                            url: `https://api.lever.co/v1/postings/${jobId}?perform_as=${fields.perform_as}`,
                            headers: headers,
                            data: JSON.stringify(job),
                        });

                        res.send({
                            status: 'ok',
                            message: 'Lever job updated',
                            result: result.data.data,
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not update job', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },

        async deleteJob(req, res) {
            try {
                const connection = res.locals.connection;
                const jobId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                // const fields: any = req.query.fields && JSON.parse((req.query as any).fields as string);

                logInfo(
                    'Revert::DELETE JOB',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    jobId
                );

                switch (thirdPartyId) {
                    case TP_ID.greenhouse: {
                        res.send({
                            status: 'ok',
                            message: 'This endpoint is currently not supported',
                        });

                        break;
                    }
                    case TP_ID.lever: {
                        res.send({
                            status: 'ok',
                            message: 'This endpoint is currently not supported',
                        });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not delete job', error);
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
