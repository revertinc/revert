import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { logInfo, logError } from '../../../../helpers/logger';
import { Prisma, xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../../../redis/client/pubsub';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import sendIntegrationStatusError from '../../sendIntegrationstatusError';

const handleZohoAuth = async ({
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
    request,
}: IntegrationAuthProps) => {
    const url = `${request?.query.accountURL}/oauth/v2/token`;
    const formData = {
        grant_type: 'authorization_code',
        client_id: clientId || config.ZOHOCRM_CLIENT_ID,
        client_secret: clientSecret || config.ZOHOCRM_CLIENT_SECRET,
        redirect_uri: `${config.OAUTH_REDIRECT_BASE}/zohocrm`,
        code,
    };

    logInfo('Zoho', request?.query, formData);

    const result = await axios({
        method: 'post',
        url: url,
        data: qs.stringify(formData),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
    });

    logInfo('OAuth creds for zohocrm', result.data);
    if (result.data.error) {
        return sendIntegrationStatusError({
            revertPublicKey,
            tenantSecretToken,
            response,
            integrationName: mapIntegrationIdToIntegrationName[integrationId],
            tenantId,
        });
    } else {
        const info = await axios({
            method: 'get',
            url: 'https://accounts.zoho.com/oauth/user/info',
            headers: {
                authorization: `Zoho-oauthtoken ${result.data.access_token}`,
            },
        });
        logInfo('Oauth token info', info.data);
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
                    tp_customer_id: info.data.Email,
                    tp_account_url: request?.query.accountURL as string,
                    app_client_id: clientId || config.ZOHOCRM_CLIENT_ID,
                    app_client_secret: clientSecret || config.ZOHOCRM_CLIENT_SECRET,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId: environmentId,
                },
                update: {
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token,
                    app_client_id: clientId || config.ZOHOCRM_CLIENT_ID,
                    app_client_secret: clientSecret || config.ZOHOCRM_CLIENT_SECRET,
                    tp_id: integrationId,
                    appId: account?.apps[0].id,
                    tp_customer_id: info.data.Email,
                    tp_account_url: request.query.accountURL as string,
                },
            });
            config.svix?.message.create(svixAppId, {
                eventType: 'connection.added',
                payload: {
                    eventType: 'connection.added',
                    connection: {
                        t_id: tenantId,
                        tp_id: TP_ID.zohocrm,
                        tp_access_token: result.data.access_token,
                        tp_customer_id: info.data.Email,
                        tp_account_url: request.query.accountURL as string,
                    },
                },
                channels: [tenantId],
            });
            await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${tenantId}`, {
                publicToken: revertPublicKey,
                status: 'SUCCESS',
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tenantId: tenantId,
                tenantSecretToken,
            } as IntegrationStatusSseMessage);
            return response.send({ status: 'ok' });
        } catch (error: any) {
            logError(error);

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                // The .code property can be accessed in a type-safe manner
                if (error?.code === 'P2002') {
                    console.error(
                        'There is a unique constraint violation, a new user cannot be created with this email'
                    );
                }
            }

            return sendIntegrationStatusError({
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
            });
        }
    }
};

export default handleZohoAuth;
