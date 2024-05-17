import { logError } from '../../helpers/logger';
import { AccountService } from '../../generated/typescript/api/resources/internal/resources/account/service/AccountService';
import {
    InternalServerError,
    NotFoundError,
    SvixAccount,
    UnAuthorizedError,
} from '../../generated/typescript/api/resources/common';
import AuthService from '../auth';
import AppService from '../app';
import prisma from '../../prisma/client';
import config from '../../config';

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
            const { accountId } = req.body;
            const createdSvixAccount = await config.svix?.application.create({
                name: accountId,
                uid: accountId,
            });

            if (!createdSvixAccount) {
                throw new InternalServerError({ error: 'Internal Server Error' });
            }

            res.send({ account: createdSvixAccount as SvixAccount, exist: true });
        } catch (error: any) {
            logError(error);
            throw new InternalServerError({ error: 'Internal server error' });
        }
    },

    async getSvixAccount(req, res) {
        try {
            const { id } = req.params;
            // const { environment } = req.query;
            const getSvixAccount = await config.svix?.application.get(id);

            if (!getSvixAccount) {
                res.send({ exist: false });
            }

            res.send({ account: getSvixAccount, exist: true });
        } catch (error: any) {
            logError(error);
            throw new InternalServerError({ error: 'Internal server error' });
        }
    },
    async createSvixAccountMagicLink(req, res) {
        try {
            const { appId } = req.body;
            const createMagicLink = await config.svix?.authentication.appPortalAccess(appId, {});

            if (!createMagicLink) {
                throw new InternalServerError({ error: 'Internal server error' });
            }

            res.send({ key: createMagicLink.url.split('#key=')[1] });
        } catch (error: any) {
            logError(error);
            throw new InternalServerError({ error: 'Internal server error' });
        }
    },
});

export { accountService };
