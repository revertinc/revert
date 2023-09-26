import { logError } from '../../helpers/logger';
import { AccountService } from '../../generated/typescript/api/resources/internal/resources/account/service/AccountService';
import { InternalServerError, NotFoundError, UnAuthorizedError } from '../../generated/typescript/api/resources/common';
import AuthService from '../auth';
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
            console.error('Could not get account for user', error);
            throw new InternalServerError({ error: 'Internal server error' });
        }
    },
    async updateAccountCredentials(req, res) {
        try {
            const { clientId, clientSecret, scopes, tpId, isRevertApp, appId } = req.body;
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
});

export { accountService };
