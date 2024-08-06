import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { AppConfig, AtsStandardObjects } from '../../constants/common';
import { disunifyAtsObject, unifyObject } from '../../helpers/crm/transform';
import { UnifiedOffer } from '../../models/unified/offer';
import { OfferService } from '../../generated/typescript/api/resources/ats/resources/offer/service/OfferService';

const objType = AtsStandardObjects.offer;

const offerServiceAts = new OfferService(
    {
        async getOffer(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const offerId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo(
                    'Revert::GET OFFER',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    offerId,
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
                            url: `https://harvest.greenhouse.io/v1/offers/${offerId}`,
                            headers: headers,
                        });
                        const unifiedOffer: any = await unifyObject<any, UnifiedOffer>({
                            obj: result.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedOffer,
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
                console.error('Could not fetch offer', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getOffers(req, res) {
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
                    'Revert::GET ALL OFFERS',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
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
                            url: `https://harvest.greenhouse.io/v1/offers?${pagingString}`,
                            headers: headers,
                        });
                        const unifiedOffers = await Promise.all(
                            result.data.map(async (job: any) => {
                                return await unifyObject<any, UnifiedOffer>({
                                    obj: job,
                                    tpId: thirdPartyId,
                                    objType,
                                    tenantSchemaMappingId: connection.schema_mapping_id,
                                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                                });
                            }),
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
                            results: unifiedOffers,
                        });
                        break;
                    }
                    case TP_ID.lever: {
                        if (!fields || (fields && !fields.opportunityId)) {
                            throw new NotFoundError({
                                error: 'The query parameter "opportunityId" is required and should be included in the "fields" parameter.',
                            });
                        }
                        const env =
                            connection?.app?.tp_id === 'lever' && (connection?.app?.app_config as AppConfig)?.env;

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

                        const url =
                            env === 'Sandbox'
                                ? `https://api.sandbox.lever.co/v1/opportunities/${fields.opportunityId}/offers?${pagingString}`
                                : `https://api.lever.co/v1/opportunities/${fields.opportunityId}/offers?${pagingString}`;

                        const result = await axios({
                            method: 'get',
                            url: url,
                            headers: headers,
                        });
                        const unifiedOffers = await Promise.all(
                            result.data.data.map(async (job: any) => {
                                return await unifyObject<any, UnifiedOffer>({
                                    obj: job,
                                    tpId: thirdPartyId,
                                    objType,
                                    tenantSchemaMappingId: connection.schema_mapping_id,
                                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                                });
                            }),
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
                            results: unifiedOffers,
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch offers', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createOffer(req, res) {
            try {
                const offerData: any = req.body as unknown as UnifiedOffer;
                const connection = res.locals.connection;
                const account = res.locals.account;
                const thirdPartyId = connection.tp_id;
                //  const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                // const fields: any = req.query.fields && JSON.parse((req.query as any).fields as string);

                const offer: any = await disunifyAtsObject<UnifiedOffer>({
                    obj: offerData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });

                logInfo('Revert::CREATE OFFER', connection.app?.env?.accountId, tenantId, offer);

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
                console.error('Could not create offer', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateOffer(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const offerData = req.body as unknown as UnifiedOffer;
                //const offerId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const fields: any = req.query.fields && JSON.parse((req.query as any).fields as string);

                const offer: any = await disunifyAtsObject<UnifiedOffer>({
                    obj: offerData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                logInfo('Revert::UPDATE OFFER', connection.app?.env?.accountId, tenantId, offerData);

                switch (thirdPartyId) {
                    case TP_ID.greenhouse: {
                        if (!fields || (fields && !fields.applicationId && !fields.onBehalfOf)) {
                            throw new NotFoundError({
                                error: 'The query parameters "applicationId","onBehalfOf" are required and should be included in the "fields" parameter.',
                            });
                        }

                        const apiToken = thirdPartyToken;
                        const credentials = Buffer.from(apiToken + ':').toString('base64');

                        const result = await axios({
                            method: 'patch',
                            url: `https://harvest.greenhouse.io/v1/applications/${fields.applicationId}/offers/current_offer`,
                            headers: {
                                Authorization: 'Basic ' + credentials,
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                'On-Behalf-Of': `${fields.onBehalfOf}`,
                            },
                            data: JSON.stringify(offer),
                        });

                        res.send({
                            status: 'ok',
                            message: 'Greenhouse Offer updated',
                            result: result.data,
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
                console.error('Could not update offer', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },

        async deleteOffer(req, res) {
            try {
                const connection = res.locals.connection;
                const offerId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                // const fields: any = req.query.fields && JSON.parse((req.query as any).fields as string);

                logInfo(
                    'Revert::DELETE OFFER',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    offerId,
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
                console.error('Could not delete offer', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()],
);

export { offerServiceAts };
