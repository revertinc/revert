import axios from 'axios';
import { TP_ID } from '@prisma/client';

import { DealService } from '../../generated/typescript/api/resources/crm/resources/deal/service/DealService';
import { InternalServerError } from '../../generated/typescript/api/resources/common';
import { NotFoundError } from '../../generated/typescript/api/resources/common';
import { logInfo, logError } from '../../helpers/logger';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import revertAuthMiddleware from '../../helpers/authMiddleware';
import { isStandardError } from '../../helpers/error';
import { unifyObject, disunifyObject } from '../../helpers/crm/transform';
import { UnifiedDeal } from '../../models/unified';
import { PipedriveDeal, PipedrivePagination } from '../../constants/pipedrive';
import { StandardObjects } from '../../constants/common';
import { fetchAssociationsDetails } from '../../helpers/crm/hubspot';

const objType = StandardObjects.deal;

const dealService = new DealService(
    {
        async getDeal(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const dealId = req.params.id;
                const fields = req.query.fields;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                logInfo(
                    'Revert::GET DEAL',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    dealId
                );

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        const formattedFields = [
                            ...String(fields || '').split(','),
                            'dealname',
                            'amount',
                            'dealstage',
                            'hs_priority',
                            'hs_deal_stage_probability',
                            'closedate',
                            'hs_is_closed_won',
                            'hs_createdate',
                        ];
                        let deal: any = await axios({
                            method: 'get',
                            url: `https://api.hubapi.com/crm/v3/objects/deals/${dealId}?properties=${formattedFields}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        deal = ([deal.data] as any[])?.[0];
                        deal = await unifyObject<any, UnifiedDeal>({
                            obj: { ...deal, ...deal?.properties },
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: deal });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        const deals = await axios({
                            method: 'get',
                            url: `https://www.zohoapis.com/crm/v3/Deals/${dealId}${fields ? `?fields=${fields}` : ''}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                        });
                        let deal = await unifyObject<any, UnifiedDeal>({
                            obj: deals.data.data?.[0],
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: deal });
                        break;
                    }
                    case TP_ID.sfdc: {
                        const instanceUrl = connection.tp_account_url;
                        const deals = await axios({
                            method: 'get',
                            url: `${instanceUrl}/services/data/v56.0/sobjects/Opportunity/${dealId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        let deal = await unifyObject<any, UnifiedDeal>({
                            obj: deals.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: deal });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const result = await axios.get<{ data: Partial<PipedriveDeal> } & PipedrivePagination>(
                            `${connection.tp_account_url}/v1/deals/${dealId}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        const deal = result.data;
                        res.send({
                            status: 'ok',
                            result: await unifyObject<any, UnifiedDeal>({
                                obj: deal.data,
                                tpId: thirdPartyId,
                                objType,
                                tenantSchemaMappingId: connection.schema_mapping_id,
                                accountFieldMappingConfig: account.accountFieldMappingConfig,
                            }),
                        });
                        break;
                    }
                    case TP_ID.closecrm: {
                        let deal: any = await axios({
                            method: 'get',
                            url: `https://api.close.com/api/v1/opportunity/${dealId}/`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });

                        deal = await unifyObject<any, UnifiedDeal>({
                            obj: deal.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: deal });
                        break;
                    }
                    case TP_ID.ms_dynamics_365_sales: {
                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/api/data/v9.2/opportunities(${dealId})`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                Accept: 'application/json',
                            },
                        });

                        const unifiedDeal = await unifyObject<any, UnifiedDeal>({
                            obj: result.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({ status: 'ok', result: unifiedDeal });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch deal', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getDeals(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const fields = req.query.fields;
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const associations = req.query.associations ? req.query.associations.split(',') : [];

                logInfo(
                    'Revert::GET ALL DEAL',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken
                );

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        const formattedFields = [
                            ...String(fields || '').split(','),
                            'dealname',
                            'amount',
                            'dealstage',
                            'hs_priority',
                            'hs_deal_stage_probability',
                            'closedate',
                            'hs_is_closed_won',
                            'hs_createdate',
                        ];
                        const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&after=${cursor}` : ''
                        }`;
                        let deals: any = await axios({
                            method: 'get',
                            url: `https://api.hubapi.com/crm/v3/objects/deals?associations=${associations}&properties=${formattedFields}&${pagingString}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        const nextCursor = deals.data?.paging?.next?.after || undefined;
                        deals = deals.data.results as any[];

                        // collect all association IDs dynamically

                        let associationIdMap: any = {};
                        associations.forEach((type) => {
                            associationIdMap[type] = [];
                            deals.forEach((deal: any) => {
                                deal.associations[type]?.results.forEach((assoc: any) => {
                                    associationIdMap[type].push({ id: assoc.id });
                                });
                            });
                        });

                        for (let type of associations) {
                            const details = await fetchAssociationsDetails(
                                type,
                                associationIdMap[type],
                                thirdPartyToken
                            );
                            deals = deals.map((deal: any) => {
                                if (deal.associations[type]) {
                                    deal.associations[type] = deal.associations[type].results.map((assoc: any) => {
                                        return details.find((detail: any) => detail.id === assoc.id) || assoc;
                                    });
                                }
                                return deal;
                            });
                        }

                        deals = await Promise.all(
                            deals?.map(
                                async (item: any) =>
                                    await unifyObject<any, UnifiedDeal>({
                                        obj: { ...item, ...item?.properties },
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
                            previous: undefined, // Field not supported by Hubspot.
                            results: deals,
                        });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        const pagingString = `${pageSize ? `&per_page=${pageSize}` : ''}${
                            cursor ? `&page_token=${cursor}` : ''
                        }`;
                        let deals: any = await axios({
                            method: 'get',
                            url: `https://www.zohoapis.com/crm/v3/Deals?fields=${fields}${pagingString}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                        });
                        const nextCursor = deals.data?.info?.next_page_token || undefined;
                        const prevCursor = deals.data?.info?.previous_page_token || undefined;
                        deals = deals.data.data;
                        deals = await Promise.all(
                            deals?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedDeal>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: deals });
                        break;
                    }
                    case TP_ID.sfdc: {
                        let pagingString = `${pageSize ? `ORDER+BY+Id+DESC+LIMIT+${pageSize}+` : ''}${
                            cursor ? `OFFSET+${cursor}` : ''
                        }`;
                        if (!pageSize && !cursor) {
                            pagingString = 'LIMIT 200';
                        }
                        const instanceUrl = connection.tp_account_url;
                        // TODO: Handle "ALL" for Hubspot & Zoho
                        const query =
                            !fields || fields === 'ALL'
                                ? `SELECT+fields(all)+from+Opportunity+${pagingString}`
                                : `SELECT+${(fields as string)
                                      .split(',')
                                      .join('+,+')}+from+Opportunity+${pagingString}`;
                        let deals: any = await axios({
                            method: 'get',
                            url: `${instanceUrl}/services/data/v56.0/query/?q=${query}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        const nextCursor = pageSize
                            ? String(deals.data?.totalSize + (parseInt(String(cursor)) || 0))
                            : undefined;
                        const prevCursor =
                            cursor && parseInt(String(cursor)) > 0
                                ? String(parseInt(String(cursor)) - deals.data?.totalSize)
                                : undefined;
                        deals = deals.data?.records;
                        deals = await Promise.all(
                            deals?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedDeal>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: deals });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&start=${cursor}` : ''
                        }`;
                        const result = await axios.get<{ data: Partial<PipedriveDeal>[] } & PipedrivePagination>(
                            `${connection.tp_account_url}/v1/deals?${pagingString}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        const nextCursor = String(result.data?.additional_data?.pagination.next_start) || undefined;
                        const prevCursor = undefined;
                        const deals = result.data.data;
                        const unifiedDeals = await Promise.all(
                            deals?.map(
                                async (d) =>
                                    await unifyObject<any, UnifiedDeal>({
                                        obj: d,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: unifiedDeals });
                        break;
                    }
                    case TP_ID.closecrm: {
                        const pagingString = `${pageSize ? `&_limit=${pageSize}` : ''}${
                            cursor ? `&_skip=${cursor}` : ''
                        }`;
                        let deals: any = await axios({
                            method: 'get',
                            url: `https://api.close.com/api/v1/opportunity/${pagingString}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });
                        const hasMore = deals.data?.has_more;
                        deals = deals.data?.data as any[];
                        deals = await Promise.all(
                            deals?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedDeal>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );

                        let cursorVal = parseInt(String(cursor));
                        if (isNaN(cursorVal)) cursorVal = 0;
                        const nextSkipVal = hasMore ? cursorVal + pageSize : undefined;
                        const prevSkipVal = cursorVal > 0 ? String(Math.max(cursorVal - pageSize, 0)) : undefined;

                        res.send({
                            status: 'ok',
                            next: nextSkipVal ? String(nextSkipVal) : undefined,
                            previous: prevSkipVal,
                            results: deals,
                        });
                        break;
                    }
                    case TP_ID.ms_dynamics_365_sales: {
                        const pagingString = cursor ? encodeURI(cursor).split('?')[1] : '';

                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/api/data/v9.2/opportunities?${pagingString}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                Accept: 'application/json',
                                Prefer: pageSize ? `odata.maxpagesize=${pageSize}` : '',
                            },
                        });

                        const unifiedDeals = await Promise.all(
                            result.data.value.map(
                                async (deal: any) =>
                                    await unifyObject<any, UnifiedDeal>({
                                        obj: deal,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({
                            status: 'ok',
                            next: result.data['@odata.nextLink'],
                            previous: undefined,
                            results: unifiedDeals,
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognised CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch deals', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createDeal(req, res) {
            try {
                const dealData = req.body as UnifiedDeal;
                const connection = res.locals.connection;
                const account = res.locals.account;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const deal = await disunifyObject<UnifiedDeal>({
                    obj: dealData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                console.log('Revert::CREATE DEAL', connection.app?.env?.accountId, tenantId, deal);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        const response = await axios({
                            method: 'post',
                            url: `https://api.hubapi.com/crm/v3/objects/deals/`,
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(deal),
                        });
                        res.send({
                            status: 'ok',
                            message: 'Hubspot deal created',
                            result: { id: response.data?.id, ...deal },
                        });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        await axios({
                            method: 'post',
                            url: `https://www.zohoapis.com/crm/v3/Deals`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(deal),
                        });
                        res.send({ status: 'ok', message: 'Zoho deal created', result: deal });
                        break;
                    }
                    case TP_ID.sfdc: {
                        const instanceUrl = connection.tp_account_url;
                        const dealCreated = await axios({
                            method: 'post',
                            url: `${instanceUrl}/services/data/v56.0/sobjects/Opportunity/`,
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(deal),
                        });
                        res.send({
                            status: 'ok',
                            message: 'SFDC deal created',
                            result: dealCreated.data,
                        });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const instanceUrl = connection.tp_account_url;
                        const pipedriveDeal = deal as Partial<PipedriveDeal>;
                        const dealCreated = await axios.post<{ data: Partial<PipedriveDeal> }>(
                            `${instanceUrl}/v1/deals`,
                            pipedriveDeal,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        res.send({
                            status: 'ok',
                            message: 'Pipedrive deal created',
                            result: {
                                ...dealCreated.data.data,
                            },
                        });
                        break;
                    }
                    case TP_ID.closecrm: {
                        if (req.body.stage) {
                            const status = await axios({
                                method: 'get',
                                url: 'https://api.close.com/api/v1/status/opportunity/',
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                    Accept: 'application/json',
                                },
                            });

                            const validStatus = status.data.data.filter(
                                (l: any) => l.label.toLowerCase() === req.body.stage.toLowerCase()
                            );

                            if (validStatus.length === 0) {
                                throw new Error('Invalid stage value for close crm');
                            }

                            deal['status_id'] = validStatus[0].id;
                        }
                        const response = await axios({
                            method: 'post',
                            url: 'https://api.close.com/api/v1/opportunity/',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: deal,
                        });
                        res.send({
                            status: 'ok',
                            message: 'Closecrm deal created',
                            result: response.data,
                        });
                        break;
                    }
                    case TP_ID.ms_dynamics_365_sales: {
                        const response = await axios({
                            method: 'post',
                            url: `${connection.tp_account_url}/api/data/v9.2/opportunities`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                            data: deal,
                        });

                        res.send({
                            status: 'ok',
                            message: 'MS Dynamics 365 Deal created.',
                            result: response.data,
                        });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognised CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not create deal', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateDeal(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const dealData = req.body as UnifiedDeal;
                const dealId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const deal = await disunifyObject<UnifiedDeal>({
                    obj: dealData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                console.log('Revert::UPDATE DEAL', connection.app?.env?.accountId, tenantId, deal, dealId);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        await axios({
                            method: 'patch',
                            url: `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`,
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(deal),
                        });
                        res.send({
                            status: 'ok',
                            message: 'Hubspot deal updated',
                            result: deal,
                        });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        await axios({
                            method: 'put',
                            url: `https://www.zohoapis.com/crm/v3/Deals/${dealId}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(deal),
                        });
                        res.send({ status: 'ok', message: 'Zoho deal updated', result: deal });
                        break;
                    }
                    case TP_ID.sfdc: {
                        const instanceUrl = connection.tp_account_url;
                        await axios({
                            method: 'patch',
                            url: `${instanceUrl}/services/data/v56.0/sobjects/Opportunity/${dealId}`,
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(deal),
                        });
                        res.send({ status: 'ok', message: 'SFDC deal updated', result: deal });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const dealUpdated = await axios.put<{ data: Partial<PipedriveDeal> }>(
                            `${connection.tp_account_url}/v1/deals/${dealId}`,
                            deal,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        res.send({
                            status: 'ok',
                            message: 'Pipedrive deal updated',
                            result: {
                                ...dealUpdated.data.data,
                            },
                        });
                        break;
                    }
                    case TP_ID.closecrm: {
                        if (req.body.stage) {
                            const status = await axios({
                                method: 'get',
                                url: 'https://api.close.com/api/v1/status/opportunity/',
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                    Accept: 'application/json',
                                },
                            });

                            const validStatus = status.data.data.filter(
                                (l: any) => l.label.toLowerCase() === req.body.stage.toLowerCase()
                            );

                            if (validStatus.length === 0) {
                                throw new Error('Invalid stage value for close crm');
                            }

                            deal['status_id'] = validStatus[0].id;
                        }

                        const response = await axios({
                            method: 'put',
                            url: `https://api.close.com/api/v1/opportunity/${dealId}/`,
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(deal),
                        });
                        res.send({
                            status: 'ok',
                            message: 'Closecrm deal updated',
                            result: response.data,
                        });
                        break;
                    }
                    case TP_ID.ms_dynamics_365_sales: {
                        const response = await axios({
                            method: 'patch',
                            url: `${connection.tp_account_url}/api/data/v9.2/opportunities(${dealId})`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                            data: deal,
                        });

                        res.send({
                            status: 'ok',
                            message: 'MS Dynamics 365 Deal updated.',
                            result: response.data,
                        });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognised CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not update deal', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async searchDeals(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const fields = req.query.fields;
                const searchCriteria: any = req.body.searchCriteria;
                const formattedFields = (fields || '').split('').filter(Boolean);
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;

                const cursor = req.query.cursor;
                const pageSize = parseInt(String(req.query.pageSize));

                logInfo(
                    'Revert::SEARCH DEAL',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    searchCriteria,
                    fields
                );

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        let deals: any = await axios({
                            method: 'post',
                            url: `https://api.hubapi.com/crm/v3/objects/deals/search`,
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify({
                                ...searchCriteria,
                                limit: pageSize || 100,
                                after: cursor || 0,
                                properties: [
                                    'hs_deal_status',
                                    'firstname',
                                    'email',
                                    'lastname',
                                    'hs_object_id',
                                    'dealname',
                                    'amount',
                                    'dealstage',
                                    'hs_priority',
                                    'hs_deal_stage_probability',
                                    'closedate',
                                    'hs_is_closed_won',
                                    ...formattedFields,
                                ],
                            }),
                        });
                        const nextCursor = deals.data?.paging?.next?.after || undefined;

                        deals = deals.data.results as any[];
                        deals = await Promise.all(
                            deals?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedDeal>({
                                        obj: { ...l, ...l?.properties },
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: undefined, results: deals });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        let deals: any = await axios({
                            method: 'get',
                            url: `https://www.zohoapis.com/crm/v3/deals/search?criteria=${searchCriteria}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                        });
                        deals = deals.data.data;
                        deals = await Promise.all(
                            deals?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedDeal>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', results: deals });
                        break;
                    }
                    case TP_ID.sfdc: {
                        const instanceUrl = connection.tp_account_url;
                        let deals: any = await axios({
                            method: 'get',
                            url: `${instanceUrl}/services/data/v56.0/search?q=${searchCriteria}`,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        deals = deals?.data?.searchRecords;
                        deals = await Promise.all(
                            deals?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedDeal>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', results: deals });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const instanceUrl = connection.tp_account_url;
                        const result = await axios.get<
                            { data: { items: { item: any; result_score: number }[] } } & PipedrivePagination
                        >(
                            `${instanceUrl}/v1/deals/search?term=${searchCriteria}${
                                formattedFields.length ? `&fields=${formattedFields.join(',')}` : ''
                            }`,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        const deals = result.data.data.items.map((item) => item.item);
                        const unifiedDeals = await Promise.all(
                            deals?.map(
                                async (d: any) =>
                                    await unifyObject<any, UnifiedDeal>({
                                        obj: d,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', results: unifiedDeals });
                        break;
                    }
                    case TP_ID.ms_dynamics_365_sales: {
                        let searchString = fields ? `$select=${fields}` : '';
                        if (searchCriteria) {
                            searchString += fields ? `&$filter=${searchCriteria}` : `$filter=${searchCriteria}`;
                        }

                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/api/data/v9.2/opportunities?${searchString}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                Accept: 'application/json',
                            },
                        });

                        const unifiedDeals = await Promise.all(
                            result.data.value.map(
                                async (contact: any) =>
                                    await unifyObject<any, UnifiedDeal>({
                                        obj: contact,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );

                        res.send({ status: 'ok', results: unifiedDeals });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognised CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not search CRM', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { dealService };
