import express from 'express';
import { randomUUID } from 'crypto';
import { TP_ID } from '@prisma/client';
import AuthService from '../../../services/auth';
import prisma from '../../../prisma/client';
import { logInfo, logDebug } from '../../../helpers/logger';

import redis from '../../../redis/client';
import { CRM_TP_ID, mapIntegrationIdToIntegrationName } from '../../../constants/common';
import hubspot from './authHandlers/hubspot';
import zoho from './authHandlers/zoho';
import processOAuthResult from '../../../helpers/auth/processOAuthResult';
import sfdc from './authHandlers/sfdc';
import pipedrive from './authHandlers/pipedrive';
import msDynamic from './authHandlers/ms_dynamic_365';
import close from './authHandlers/close';

const authRouter = express.Router({ mergeParams: true });

/**
 * OAuth API
 */

authRouter.get('/oauth-callback', async (req, res) => {
    logInfo('OAuth callback', req.query);
    const integrationId = req.query.integrationId as CRM_TP_ID;
    const revertPublicKey = req.query.x_revert_public_token as string;

    // generate a token for connection auth and save in redis for 5 mins
    const tenantSecretToken = randomUUID();
    logDebug('blah tenantSecretToken', tenantSecretToken);
    await redis.setEx(`tenantSecretToken_${req.query.t_id}`, 5 * 60, tenantSecretToken);

    try {
        const account = await prisma.environments.findFirst({
            where: {
                public_token: String(revertPublicKey),
            },
            include: {
                apps: {
                    select: {
                        id: true,
                        app_client_id: true,
                        app_client_secret: true,
                        is_revert_app: true,
                        app_config: true,
                    },
                    where: { tp_id: integrationId },
                },
                accounts: true,
            },
        });

        const clientId = account?.apps[0]?.is_revert_app ? undefined : account?.apps[0]?.app_client_id;
        const clientSecret = account?.apps[0]?.is_revert_app ? undefined : account?.apps[0]?.app_client_secret;
        const svixAppId = account!.accounts!.id;
        const environmentId = account?.id;

        const handleAuthProps = {
            account,
            clientId,
            clientSecret,
            code: req.query.code as string,
            integrationId,
            revertPublicKey,
            svixAppId,
            environmentId,
            tenantId: String(req.query.t_id),
            tenantSecretToken,
            response: res,
            request: req,
        };

        if (req.query.code && req.query.t_id && revertPublicKey) {
            switch (integrationId) {
                case TP_ID.hubspot:
                    return hubspot.handleOAuth(handleAuthProps);
                case TP_ID.zohocrm:
                    return zoho.handleOAuth(handleAuthProps);
                case TP_ID.sfdc:
                    return sfdc.handleOAuth(handleAuthProps);
                case TP_ID.pipedrive:
                    return pipedrive.handleOAuth(handleAuthProps);
                case TP_ID.closecrm:
                    return close.handleOAuth(handleAuthProps);
                case TP_ID.ms_dynamics_365_sales:
                    return msDynamic.handleOAuth(handleAuthProps);

                default:
                    return processOAuthResult({
                        status: false,
                        revertPublicKey,
                        tenantSecretToken,
                        response: res,
                        tenantId: req.query.t_id as string,
                        statusText: 'Not implemented yet',
                    });
            }
        } else {
            return processOAuthResult({
                status: false,
                revertPublicKey,
                tenantSecretToken,
                response: res,
                tenantId: req.query.t_id as string,
                statusText: 'noop',
            });
        }
    } catch (error: any) {
        return processOAuthResult({
            status: false,
            error,
            revertPublicKey,
            integrationName: mapIntegrationIdToIntegrationName[integrationId],
            tenantSecretToken,
            response: res,
            tenantId: req.query.t_id as string,
            statusText: 'Error while getting oauth creds',
        });
    }
});

authRouter.get('/oauth/refresh', async (_, res) => {
    res.status(200).send(await AuthService.refreshOAuthTokensForThirdParty());
});
export default authRouter;
