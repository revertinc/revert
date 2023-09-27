import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { logError } from './logger';

const revertAuthMiddleware = () => async (req: Request, res: Response, next: () => any) => {
    const nonSecurePaths = ['/oauth-callback', '/oauth/refresh'];
    const nonSecurePathsPartialMatch = ['/integration-status'];
    if (nonSecurePaths.includes(req.path) || nonSecurePathsPartialMatch.some((path) => req.path.includes(path)))
        return next();
    const { 'x-revert-api-token': token, 'x-revert-t-token': tenantSecretToken } = req.headers;

    if (tenantSecretToken && !token) {
        return next();
    }

    if (!token) {
        res.status(401).send({
            error: 'Api token unauthorized',
        });
        return;
    }
    try {
        const account = await prisma.accounts.findMany({
            where: {
                environments: {
                    some: {
                        private_token: token as string,
                    },
                },
            },
            include: {
                environments: true,
                accountFieldMappingConfig: true,
            },
        });
        if (!account || !account.length) {
            return res.status(401).send({
                error: 'Api token unauthorized',
            });
        }
        res.locals.account = account[0];
        return next();
    } catch (error: any) {
        logError(error);
        return res.status(400).send({
            error: 'Bad request',
        });
    }
};

export default revertAuthMiddleware;
