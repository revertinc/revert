import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { AtsStandardObjects } from '../../constants/common';
import { unifyObject } from '../../helpers/crm/transform';
import { UnifiedCandidate } from '../../models/unified/candidate';
import { CandidateService } from '../../generated/typescript/api/resources/ats/resources/candidate/service/CandidateService';

const objType = AtsStandardObjects.candidate;

const candidateServiceAts = new CandidateService(
    {
        async getCandidate(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const candidateId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo(
                    'Revert::GET CANDIDATE',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    candidateId
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
                            url: `https://harvest.greenhouse.io/v1/candidates/${candidateId}`,
                            headers: headers,
                        });

                        const unifiedCandidate: any = await unifyObject<any, UnifiedCandidate>({
                            obj: result.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedCandidate,
                        });
                        break;
                    }
                    case TP_ID.lever: {
                        const headers = { Authorization: `Bearer ${thirdPartyToken}` };

                        const result = await axios({
                            method: 'get',
                            url: `https://api.lever.co/v1/opportunities/${candidateId}`,
                            headers: headers,
                        });

                        const unifiedCandidate: any = await unifyObject<any, UnifiedCandidate>({
                            obj: result.data.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedCandidate,
                        });
                        break;
                    }

                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch candidate', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getCandidates(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                //const fields: any = JSON.parse(req.query.fields as string);
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;

                logInfo(
                    'Revert::GET ALL CANDIDATES',
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
                            url: `https://harvest.greenhouse.io/v1/candidates?${pagingString}`,
                            headers: headers,
                        });
                        const unifiedCandidates = await Promise.all(
                            result.data.map(async (candidate: any) => {
                                return await unifyObject<any, UnifiedCandidate>({
                                    obj: candidate,
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
                            results: unifiedCandidates,
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
                            url: `https://api.lever.co/v1/opportunities?${pagingString}`,
                            headers: headers,
                        });
                        const unifiedCandidates = await Promise.all(
                            result.data.data.map(async (candidate: any) => {
                                return await unifyObject<any, UnifiedCandidate>({
                                    obj: candidate,
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
                            results: unifiedCandidates,
                        });

                        break;
                    }

                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch candidates', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { candidateServiceAts };
