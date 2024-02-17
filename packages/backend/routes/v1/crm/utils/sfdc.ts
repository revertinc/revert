import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { logInfo, logError } from '../../../../helpers/logger';
import { Prisma, xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../../../redis/client/pubsub';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import sendIntegrationStatusError from 'routes/v1/sendIntegrationstatusError';

export const handleSfdcAuth = async ({
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
}: IntegrationAuthProps) => {
    // Handle the received code
    const url = 'https://login.salesforce.com/services/oauth2/token';
    const formData = {
        grant_type: 'authorization_code',
        client_id: clientId || config.SFDC_CLIENT_ID,
        client_secret: clientSecret || config.SFDC_CLIENT_SECRET,
        redirect_uri: `${config.OAUTH_REDIRECT_BASE}/sfdc`,
        code,
    };
    const result = await axios({
        method: 'post',
        url: url,
        data: qs.stringify(formData),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
    });
    logInfo('OAuth creds for sfdc', result.data);
    const info = await axios({
        method: 'get',
        url: 'https://login.salesforce.com/services/oauth2/userinfo',
        headers: {
            authorization: `Bearer ${result.data.access_token}`,
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
                tp_customer_id: info.data.email,
                tp_account_url: info.data.urls['custom_domain'],
                app_client_id: clientId || config.SFDC_CLIENT_ID,
                app_client_secret: clientSecret || config.SFDC_CLIENT_SECRET,
                owner_account_public_token: revertPublicKey,
                appId: account?.apps[0].id,
                environmentId: environmentId,
            },
            update: {
                tp_access_token: result.data.access_token,
                tp_refresh_token: result.data.refresh_token,
                app_client_id: clientId || config.SFDC_CLIENT_ID,
                app_client_secret: clientSecret || config.SFDC_CLIENT_SECRET,
                tp_id: integrationId,
                appId: account?.apps[0].id,
                tp_customer_id: info.data.email,
                tp_account_url: info.data.urls['custom_domain'],
            },
        });
        config.svix?.message.create(svixAppId, {
            eventType: 'connection.added',
            payload: {
                eventType: 'connection.added',
                connection: {
                    t_id: tenantId,
                    tp_id: TP_ID.sfdc,
                    tp_access_token: result.data.access_token,
                    tp_customer_id: info.data.email,
                    tp_account_url: info.data.urls['custom_domain'],
                },
            },
            channels: [tenantId],
        });
        await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${tenantId}`, {
            publicToken: revertPublicKey,
            status: 'SUCCESS',
            integrationName: mapIntegrationIdToIntegrationName[integrationId],
            tenantId,
            tenantSecretToken,
        } as IntegrationStatusSseMessage);
        return response.send({ status: 'ok', tp_customer_id: info.data.email });
    } catch (error: any) {
        logError(error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // The .code property can be accessed in a type-safe manner
            if (error?.code === 'P2002') {
                console.error('There is a unique constraint violation, a new user cannot be created with this email');
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
};

export default handleSfdcAuth;
