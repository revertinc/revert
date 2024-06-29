import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { disunifyAccountingObject, unifyObject } from '../../helpers/crm/transform';
import { AccountingStandardObjects } from '../../constants/common';
import { AccountService } from '../../generated/typescript/api/resources/accounting/resources/account/service/AccountService';
import { UnifiedAccount } from '../../models/unified/account';

const objType = AccountingStandardObjects.account;

const accountServiceAccounting = new AccountService(
    {
        async getAccount(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const accountId = req.params.id; //this is id that will be used to get the particular acccount for the below integrations.
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const fields: any = JSON.parse(req.query.fields as string);
                logInfo(
                    'Revert::GET ACCOUNT',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    accountId
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
                            url: `https://quickbooks.api.intuit.com/v3/company/${fields.realmID}/account/${accountId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });

                        const unifiedAccount: any = await unifyObject<any, UnifiedAccount>({
                            obj: result.data.Account,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedAccount,
                        });
                        break;
                    }
                    case TP_ID.xero: {
                        const result = await axios({
                            method: 'GET',
                            url: `https://api.xero.com/api.xro/2.0/Accounts/${accountId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });

                        const unifiedAccount: any = await unifyObject<any, UnifiedAccount>({
                            obj: result.data.Accounts[0],
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedAccount,
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch account', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },

        async getAccounts(req, res) {
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
                    'Revert::GET ALL ACCOUNTS',
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
                            url: `https://quickbooks.api.intuit.com/v3/company/${fields.realmID}/query?query=select * from Account ${pagingString}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });

                        const unifiedAccounts: any = await Promise.all(
                            result.data.QueryResponse.Account.map(
                                async (accountItem: any) =>
                                    await unifyObject<any, UnifiedAccount>({
                                        obj: accountItem,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        const nextCursor = pageSize
                            ? String(result.data.QueryResponse?.maxResults + (parseInt(String(cursor)) || 0))
                            : undefined;
                        res.send({
                            status: 'ok',
                            next: nextCursor,
                            results: unifiedAccounts,
                        });
                        break;
                    }
                    case TP_ID.xero: {
                        const pagingString = `${cursor ? `page=${cursor}` : ''}`;
                        const result = await axios({
                            method: 'GET',
                            url: `https://api.xero.com/api.xro/2.0/Accounts?${pagingString}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });

                        const unifiedAccounts: any = await Promise.all(
                            result.data.Accounts.map(
                                async (accountItem: any) =>
                                    await unifyObject<any, UnifiedAccount>({
                                        obj: accountItem,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        const hasMoreResults = result.data.Accounts.length === 100;
                        const nextCursor = hasMoreResults ? (cursor ? cursor + 1 : 2) : undefined;
                        res.send({
                            status: 'ok',
                            next: nextCursor ? String(nextCursor) : undefined,
                            results: unifiedAccounts,
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch accounts', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },

        async createAccount(req, res) {
            try {
                const accountData: any = req.body as unknown as UnifiedAccount;
                const connection = res.locals.connection;
                const account = res.locals.account;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const fields: any = JSON.parse((req.query as any).fields as string);

                const disunifiedAccountData: any = await disunifyAccountingObject<UnifiedAccount>({
                    obj: accountData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });

                logInfo('Revert::CREATE ACCOUNT', connection.app?.env?.accountId, tenantId, disunifiedAccountData);

                switch (thirdPartyId) {
                    case TP_ID.quickbooks: {
                        if (!fields || (fields && !fields.realmID)) {
                            throw new NotFoundError({
                                error: 'The query parameter "realmID" is required and should be included in the "fields" parameter.',
                            });
                        }

                        const result: any = await axios({
                            method: 'post',
                            url: `https://quickbooks.api.intuit.com/v3/company/${fields.realmID}/account`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(disunifiedAccountData),
                        });
                        res.send({ status: 'ok', message: 'QuickBooks account created', result: result.data.Account });

                        break;
                    }
                    case TP_ID.xero: {
                        const result: any = await axios({
                            method: 'put',
                            url: `https://api.xero.com/api.xro/2.0/Accounts`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(disunifiedAccountData),
                        });
                        res.send({ status: 'ok', message: 'Xero account created', result: result.data.Account });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not create account', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateAccount(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const accountData = req.body as unknown as UnifiedAccount;
                const accountId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const fields: any = JSON.parse((req.query as any).fields as string);

                if (thirdPartyId === TP_ID.quickbooks && accountData && !accountData.id) {
                    throw new Error('The parameter "id" is required in request body.');
                }

                const disunifiedAccountData: any = await disunifyAccountingObject<UnifiedAccount>({
                    obj: accountData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });

                logInfo('Revert::UPDATE ACCOUNT', connection.app?.env?.accountId, tenantId, accountData);

                switch (thirdPartyId) {
                    case TP_ID.quickbooks: {
                        if (!fields || (fields && !fields.realmID)) {
                            throw new NotFoundError({
                                error: 'The query parameter "realmID" is required and should be included in the "fields" parameter.',
                            });
                        }
                        disunifiedAccountData.Id = accountId;

                        const result: any = await axios({
                            method: 'post',
                            url: `https://quickbooks.api.intuit.com/v3/company/${fields.realmID}/account`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(disunifiedAccountData),
                        });

                        res.send({
                            status: 'ok',
                            message: 'QuickBooks Account updated',
                            result: result.data.Account,
                        });

                        break;
                    }
                    case TP_ID.xero: {
                        const result: any = await axios({
                            method: 'post',
                            url: `https://api.xero.com/api.xro/2.0/Accounts/${accountId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(disunifiedAccountData),
                        });

                        res.send({
                            status: 'ok',
                            message: 'Xero Account updated',
                            result: result.data.Account,
                        });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not update account', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { accountServiceAccounting };
