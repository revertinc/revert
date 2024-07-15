import { logError } from '../../helpers/logger';
import { AccountService } from '../../generated/typescript/api/resources/internal/resources/account/service/AccountService';
import SvixService from '../svix';
import {
    InternalServerError,
    NotFoundError,
    SvixAccount,
    UnAuthorizedError,
} from '../../generated/typescript/api/resources/common';
import AuthService from '../auth';
import AppService from '../app';
import prisma from '../../prisma/client';

const accountService = new AccountService({
    async getAccountDetails(req, res) {
        try {
            const userId = req.body.userId;
            const result = await AuthService.getAccountForUser(userId);
            if (result?.error) {
                throw new NotFoundError({ error: 'Could not get the account for user' });
            } else {
                res.send(result);
            }
        } catch (error: any) {
            logError(error);
            console.error('Could not get account for user', req.body, error);
            throw new InternalServerError({ error: 'Internal server error' });
        }
    },
    async updateAccountCredentials(req, res) {
        try {
            const { clientId, clientSecret, scopes, tpId, isRevertApp, appId, appConfig } = req.body;
            const { 'x-revert-api-token': token } = req.headers;
            const account = await prisma.accounts.findFirst({
                where: {
                    private_token: token as string,
                },
                select: {
                    public_token: true,
                },
            });
            if (!account) {
                throw new UnAuthorizedError({
                    error: 'Api token unauthorized',
                });
            }
            const result = await AuthService.setAppCredentialsForUser({
                appId,
                publicToken: account.public_token,
                clientId,
                clientSecret,
                scopes,
                isRevertApp,
                tpId,
                appConfig,
            });
            if (result?.error) {
                throw new NotFoundError({ error: 'Could not get account for user' });
            } else {
                return res.send(result);
            }
        } catch (error: any) {
            logError(error);
            console.error('Could not get account for user', error);
            throw new InternalServerError({ error: 'Internal server error' });
        }
    },
    async createRevertAppForAccount(req, res) {
        try {
            const { userId, tpId, environment } = req.body;
            const result = await AuthService.getAccountForUser(userId);

            if (result?.error) {
                throw new NotFoundError({ error: 'Could not get the account for user' });
            }

            const isCreated = await AppService.createRevertAppForAccount({
                accountId: result.account.id as string,
                tpId,
                environment,
            });
            const isCreated = await AppService.createRevertAppForAccount({
                accountId: result.account.id as string,
                tpId,
                environment,
            });

            if (isCreated?.error) {
                throw new InternalServerError({ error: 'Internal Server Error' });
            }

            const finalResult = await AuthService.getAccountForUser(userId);
            res.send({ ...finalResult });
        } catch (error: any) {
            logError(error);
            throw new InternalServerError({ error: 'Internal server error' });
        }
    },

    async createSvixAccount(req, res) {
        try {
            const { accountId, environment } = req.body;
            const svixAccount = await SvixService.createSvixAccount({ accountId, environment });
            if (svixAccount) {
                return res.send({
                    account: svixAccount as SvixAccount,
                    exist: true,
                    environment,
                });
            }

            return res.send({ exist: false, environment });
        } catch (error: any) {
            logError(error);
            throw new InternalServerError({ error: 'Internal server error' });
        }
    },

    async getSvixAccount(req, res) {
        try {
            const { id } = req.params;
            const { environment } = req.query;
            const svixAccount = await SvixService.getSvixAccount({ accountId: id, environment });

            if (!svixAccount) {
                return res.send({ exist: false, environment });
            }

            return res.send({ account: svixAccount, exist: true, environment });
        } catch (error: any) {
            logError(error);
            throw new InternalServerError({ error: 'Internal server error' });
        }
    },
    async createSvixAccountMagicLink(req, res) {
        try {
            const { appId } = req.body;
            const environment = appId.split('_')[2];
            const portalMagicLink = await SvixService.createAppPortalMagicLink(appId);
            if (!portalMagicLink) {
                return res.send({ key: '', environment });
            }

            return res.send({ key: portalMagicLink.url.split('#key=')[1], environment });
        } catch (error: any) {
            logError(error);
            throw new InternalServerError({ error: 'Internal server error' });
        }
    },
    async deleteRevertAppforAccount(req, res) {
        try {
            const { appId } = req.body;
            const { 'x-revert-api-token': token } = req.headers;
            const account = await prisma.accounts.findFirst({
                where: {
                    private_token: token as string,
                },
                select: {
                    public_token: true,
                },
            });

            if (!account) {
                throw new UnAuthorizedError({
                    error: 'Api token unauthorized',
                });
            }

            const result = await prisma.apps.delete({
                where: {
                    id: appId,
                },
            });

            const { id } = result;
            res.send({ appId: id, delete: true });
        } catch (error: any) {
            logError(error);
            throw new InternalServerError({ error: 'Something went wrong while deleting app' });
        }
    },
});

export { accountService };
