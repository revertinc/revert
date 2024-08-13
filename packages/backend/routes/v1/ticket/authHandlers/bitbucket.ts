import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { logInfo } from '../../../../helpers/logger';
import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';

class BitbucketAuthHandler extends BaseOAuthHandler {
    async handleOAuth({
        account,
        clientId,
        clientSecret,
        code,
        integrationId,
        revertPublicKey,
        svixAppId,
        environmentId,
        tenantId,
        tenantSecretToken,
        response,
        redirectUrl,
    }: IntegrationAuthProps) {
        const formData = {
            grant_type: 'authorization_code',
            code: code,
        };
        const headerData = {
            client_id: clientId || config.BITBUCKET_CLIENT_ID,
            client_secret: clientSecret || config.BITBUCKET_CLIENT_SECRET,
        };
        const encodedClientIdSecret = Buffer.from(headerData.client_id + ':' + headerData.client_secret).toString(
            'base64',
        );
        const result: any = await axios({
            method: 'post',
            url: 'https://bitbucket.org/site/oauth2/access_token',
            headers: {
                Authorization: 'Basic ' + encodedClientIdSecret,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: qs.stringify(formData),
        });

        logInfo('OAuth creds for Bitbucket', result.data);

        const auth = 'Bearer ' + result.data?.access_token;

        const info = await axios({
            method: 'GET',
            url: `https://api.bitbucket.org/2.0/user`,
            headers: {
                Authorization: auth,
                Accept: 'application/json',
            },
        });
        logInfo('User info', info.data);

        try {
            await xprisma.connections.upsert({
                where: {
                    id: tenantId,
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token,
                    tp_customer_id: info.data?.account_id,
                    app_client_id: clientId || config.BITBUCKET_CLIENT_ID,
                    app_client_secret: clientSecret || config.BITBUCKET_CLIENT_SECRET,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId: environmentId,
                },
                update: {
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token,
                    app_client_id: clientId || config.BITBUCKET_CLIENT_ID,
                    app_client_secret: clientSecret || config.BITBUCKET_CLIENT_SECRET,
                    tp_id: integrationId,
                    appId: account?.apps[0].id,
                    tp_customer_id: info.data?.account_id,
                },
            });

            await sendConnectionAddedEvent(
                svixAppId,
                tenantId,
                TP_ID.bitbucket,
                result.data.access_token,
                info.data?.account_id,
            );

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: info.data?.account_id,
                redirectUrl,
            });
        } catch (error: any) {
            return processOAuthResult({
                status: false,
                error,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                redirectUrl,
            });
        }
    }
}

export default new BitbucketAuthHandler();
