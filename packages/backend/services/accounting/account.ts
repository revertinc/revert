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

                disunifiedAccountData.Id = accountId;

                logInfo('Revert::UPDATE ACCOUNT', connection.app?.env?.accountId, tenantId, accountData);

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

                        res.send({
                            status: 'ok',
                            message: 'QuickBooks Account updated',
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
