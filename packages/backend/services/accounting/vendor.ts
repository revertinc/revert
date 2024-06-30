import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { disunifyAccountingObject, unifyObject } from '../../helpers/crm/transform';
import { AccountingStandardObjects } from '../../constants/common';
import { UnifiedVendor } from '../../models/unified/vendor';
import { VendorService } from '../../generated/typescript/api/resources/accounting/resources/vendor/service/VendorService';

const objType = AccountingStandardObjects.vendor;

const vendorServiceAccounting = new VendorService(
    {
        async getVendor(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const vendorId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const fields: any = JSON.parse(req.query.fields as string);
                logInfo(
                    'Revert::GET VENDOR',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    vendorId
                );

                switch (thirdPartyId) {
                    case TP_ID.quickbooks: {
                        if (!fields || (fields && !fields.realmID)) {
                            throw new NotFoundError({
                                error: 'The query parameter "realmID" is required and should be included in the "fields" parameter.',
                            });
                        }

                        const result = await axios({
                            method: 'GET',
                            url: `https://quickbooks.api.intuit.com/v3/company/${fields.realmID}/vendor/${vendorId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });

                        const unifiedVendor: any = await unifyObject<any, UnifiedVendor>({
                            obj: result.data.Vendor,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedVendor,
                        });
                        break;
                    }
                    case TP_ID.xero: {
                        const result = await axios({
                            method: 'GET',
                            url: `https://api.xero.com/api.xro/2.0/contacts/${vendorId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });

                        const unifiedVendor: any = await unifyObject<any, UnifiedVendor>({
                            obj: result.data.Contacts[0],
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedVendor,
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch vendor', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getVendors(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const fields: any = req.query.fields ? JSON.parse(req.query.fields as string) : undefined;
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;

                logInfo(
                    'Revert::GET ALL VENDORS',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken
                );
                switch (thirdPartyId) {
                    case TP_ID.quickbooks: {
                        if (!fields || (fields && !fields.realmID)) {
                            throw new NotFoundError({
                                error: 'The query parameter "realmID" is required and should be included in the "fields" parameter.',
                            });
                        }

                        let pagingString = `${cursor ? ` STARTPOSITION +${cursor}+` : ''}${
                            pageSize ? ` MAXRESULTS +${pageSize}` : ''
                        }`;

                        const result = await axios({
                            method: 'GET',
                            url: `https://quickbooks.api.intuit.com/v3/company/${fields.realmID}/query?query=select * from Vendor ${pagingString}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });

                        const unifiedVendors: any = result.data.QueryResponse.Vendor
                            ? await Promise.all(
                                  result.data.QueryResponse.Vendor.map(
                                      async (vendor: any) =>
                                          await unifyObject<any, UnifiedVendor>({
                                              obj: vendor,
                                              tpId: thirdPartyId,
                                              objType,
                                              tenantSchemaMappingId: connection.schema_mapping_id,
                                              accountFieldMappingConfig: account.accountFieldMappingConfig,
                                          })
                                  )
                              )
                            : {};
                        const nextCursor =
                            pageSize && result.data.QueryResponse?.maxResults
                                ? String(pageSize + (parseInt(String(cursor)) || 0))
                                : undefined;
                        res.send({
                            status: 'ok',
                            next: nextCursor,
                            results: unifiedVendors,
                        });
                        break;
                    }
                    case TP_ID.xero: {
                        const pagingString = `${cursor ? `page=${cursor}` : ''}`;
                        const result = await axios({
                            method: 'GET',
                            url: `https://api.xero.com/api.xro/2.0/contacts?${pagingString}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });

                        const unifiedVendors: any = await Promise.all(
                            result.data.Contacts.map(
                                async (contact: any) =>
                                    await unifyObject<any, UnifiedVendor>({
                                        obj: contact,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        const hasMoreResults = result.data.Contacts.length === 100;
                        const nextCursor = hasMoreResults ? (cursor ? cursor + 1 : 2) : undefined;

                        res.send({
                            status: 'ok',
                            next: nextCursor ? String(nextCursor) : undefined,
                            results: unifiedVendors,
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch vendors', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },

        async createVendor(req, res) {
            try {
                const vendorData: any = req.body as unknown as UnifiedVendor;
                const connection = res.locals.connection;
                const account = res.locals.account;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const fields: any = JSON.parse((req.query as any).fields as string);

                const disunifiedVendorData: any = await disunifyAccountingObject<UnifiedVendor>({
                    obj: vendorData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });

                logInfo('Revert::CREATE VENDOR', connection.app?.env?.accountId, tenantId, disunifiedVendorData);

                switch (thirdPartyId) {
                    case TP_ID.quickbooks: {
                        if (!fields || (fields && !fields.realmID)) {
                            throw new NotFoundError({
                                error: 'The query parameter "realmID" is required and should be included in the "fields" parameter.',
                            });
                        }

                        const result: any = await axios({
                            method: 'post',
                            url: `https://quickbooks.api.intuit.com/v3/company/${fields.realmID}/vendor`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(disunifiedVendorData),
                        });
                        res.send({ status: 'ok', message: 'QuickBooks Vendor created', result: result.data.Vendor });

                        break;
                    }
                    case TP_ID.xero: {
                        const result: any = await axios({
                            method: 'post',
                            url: `https://api.xero.com/api.xro/2.0/contacts`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(disunifiedVendorData),
                        });
                        res.send({ status: 'ok', message: 'Xero Vendor created', result: result.data.Contacts });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not create Vendor', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateVendor(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const vendorData = req.body as unknown as UnifiedVendor;
                const vendorId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const fields: any = JSON.parse((req.query as any).fields as string);

                if (thirdPartyId === TP_ID.quickbooks && vendorData && !vendorData.id) {
                    throw new Error('The parameter "id" is required in request body.');
                }

                const disunifiedVendorData: any = await disunifyAccountingObject<UnifiedVendor>({
                    obj: vendorData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });

                logInfo('Revert::UPDATE VENDOR', connection.app?.env?.accountId, tenantId, vendorData);

                switch (thirdPartyId) {
                    case TP_ID.quickbooks: {
                        if (!fields || (fields && !fields.realmID)) {
                            throw new NotFoundError({
                                error: 'The query parameter "realmID" is required and should be included in the "fields" parameter.',
                            });
                        }
                        disunifiedVendorData.Id = vendorId;
                        const result: any = await axios({
                            method: 'post',
                            url: `https://quickbooks.api.intuit.com/v3/company/${fields.realmID}/vendor`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(disunifiedVendorData),
                        });

                        res.send({
                            status: 'ok',
                            message: 'QuickBooks Vendor updated',
                            result: result.data.Vendor,
                        });

                        break;
                    }
                    case TP_ID.xero: {
                        const result: any = await axios({
                            method: 'post',
                            url: `https://api.xero.com/api.xro/2.0/contacts/${vendorId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(disunifiedVendorData),
                        });
                        res.send({ status: 'ok', message: 'Xero Vendor updated', result: result.data.Contacts });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not update Vendor', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { vendorServiceAccounting };
