import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { logInfo, logError } from '../../../../helpers/logger';
import { Prisma, xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../../../redis/client/pubsub';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import sendIntegrationStatusError from '../../sendIntegrationstatusError';

const handleHubspotAuth = async ({
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
    const url = 'https://api.hubapi.com/oauth/v1/token';
    const formData = {
        grant_type: 'authorization_code',
        client_id: clientId || config.HUBSPOT_CLIENT_ID,
        client_secret: clientSecret || config.HUBSPOT_CLIENT_SECRET,
        redirect_uri: `${config.OAUTH_REDIRECT_BASE}/hubspot`,
        code: code,
    };
    const result = await axios({
        method: 'post',
        url: url,
        data: qs.stringify(formData),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
    });
    logInfo('OAuth creds for hubspot', result.data);
    const info = await axios({
        method: 'get',
        url: 'https://api.hubapi.com/oauth/v1/access-tokens/' + result.data.access_token,
    });
    logInfo('Oauth token info', info.data);
    try {
        await xprisma.connections.upsert({
            where: {
                id: tenantId,
            },
            update: {
                tp_access_token: result.data.access_token,
                tp_refresh_token: result.data.refresh_token,
                app_client_id: clientId || config.HUBSPOT_CLIENT_ID,
                app_client_secret: clientSecret || config.HUBSPOT_CLIENT_SECRET,
                tp_id: integrationId,
                appId: account?.apps[0].id,
                tp_customer_id: info.data.user,
            },
            create: {
                id: tenantId,
                t_id: tenantId,
                tp_id: integrationId,
                tp_access_token: result.data.access_token,
                tp_refresh_token: result.data.refresh_token,
                app_client_id: clientId || config.HUBSPOT_CLIENT_ID,
                app_client_secret: clientSecret || config.HUBSPOT_CLIENT_SECRET, // TODO: Fix in other platforms.
                tp_customer_id: info.data.user,
                owner_account_public_token: revertPublicKey,
                appId: account?.apps[0].id,
                environmentId: environmentId,
            },
        });
        config.svix?.message.create(svixAppId, {
            eventType: 'connection.added',
            payload: {
                eventType: 'connection.added',
                connection: {
                    t_id: tenantId,
                    tp_id: TP_ID.hubspot,
                    tp_access_token: result.data.access_token,
                    tp_customer_id: info.data.user,
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
        return response.send({ status: 'ok', tp_customer_id: info.data.user });
    } catch (error: any) {
        logError(error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // The .code property can be accessed in a type-safe manner
            if (error?.code === 'P2002') {
                console.error('There is a unique constraint violation, a new user cannot be created with this email');
            }
        }

        console.error('Could not update db', error);

        return sendIntegrationStatusError({
            revertPublicKey,
            tenantSecretToken,
            response,
            tenantId: tenantId,
            integrationName: mapIntegrationIdToIntegrationName[integrationId],
        });
    }
};

export default handleHubspotAuth;
