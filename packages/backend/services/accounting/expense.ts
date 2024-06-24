import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { disunifyAccountingObject, unifyObject } from '../../helpers/crm/transform';
import { AccountingStandardObjects } from '../../constants/common';
import { ExpenseService } from '../../generated/typescript/api/resources/accounting/resources/expense/service/ExpenseService';
import { UnifiedExpense } from '../../models/unified/expense';

const objType = AccountingStandardObjects.expense;

const expenseServiceAccounting = new ExpenseService(
    {
        async getExpense(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const purchaseId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const fields: any = JSON.parse(req.query.fields as string);
                logInfo(
                    'Revert::GET EXPENSE',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    purchaseId
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
                            url: `https://quickbooks.api.intuit.com/v3/company/${fields.realmID}/purchase/${purchaseId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });

                        const unifiedExpense: any = await unifyObject<any, UnifiedExpense>({
                            obj: result.data.Purchase,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({
                            status: 'ok',
                            result: unifiedExpense,
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch expense', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },

        async createExpense(req, res) {
            try {
                const expenseData: any = req.body as unknown as UnifiedExpense;
                const connection = res.locals.connection;
                const account = res.locals.account;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const fields: any = JSON.parse((req.query as any).fields as string);

                const disunifiedExpenseData: any = await disunifyAccountingObject<UnifiedExpense>({
                    obj: expenseData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });

                logInfo('Revert::CREATE EXPENSE', connection.app?.env?.accountId, tenantId, disunifiedExpenseData);

                switch (thirdPartyId) {
                    case TP_ID.quickbooks: {
                        if (!fields || (fields && !fields.realmID)) {
                            throw new NotFoundError({
                                error: 'The query parameter "realmID" is required and should be included in the "fields" parameter.',
                            });
                        }

                        const result: any = await axios({
                            method: 'post',
                            url: `https://quickbooks.api.intuit.com/v3/company/${fields.realmID}/purchase`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(disunifiedExpenseData),
                        });
                        res.send({ status: 'ok', message: 'QuickBooks Expense created', result: result.data.Purchase });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not create Expense', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async updateExpense(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const expenseData = req.body as unknown as UnifiedExpense;
                const expenseId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const fields: any = JSON.parse((req.query as any).fields as string);

                if (thirdPartyId === TP_ID.quickbooks && expenseData && !expenseData.id) {
                    throw new Error('The parameter "id" is required in request body.');
                }

                const disunifiedExpenseData: any = await disunifyAccountingObject<UnifiedExpense>({
                    obj: expenseData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });

                disunifiedExpenseData.Id = expenseId;

                logInfo('Revert::UPDATE EXPENSE', connection.app?.env?.accountId, tenantId, expenseData);

                switch (thirdPartyId) {
                    case TP_ID.quickbooks: {
                        if (!fields || (fields && !fields.realmID)) {
                            throw new NotFoundError({
                                error: 'The query parameter "realmID" is required and should be included in the "fields" parameter.',
                            });
                        }

                        const result: any = await axios({
                            method: 'post',
                            url: `https://quickbooks.api.intuit.com/v3/company/${fields.realmID}/purchase`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(disunifiedExpenseData),
                        });

                        res.send({
                            status: 'ok',
                            message: 'QuickBooks Expense updated',
                            result: result.data.Purchase,
                        });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not update Expense', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { expenseServiceAccounting };
