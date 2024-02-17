import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { logInfo, logError } from '../../../../helpers/logger';
import { Prisma, xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../../../redis/client/pubsub';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import sendIntegrationStatusError from '../../sendIntegrationstatusError';

const handleLinearAuth = async ({
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
    const url = `https://api.linear.app/oauth/token`;
    const formData = {
        grant_type: 'authorization_code',
        client_id: clientId || config.LINEAR_CLIENT_ID,
        client_secret: clientSecret || config.LINEAR_CLIENT_SECRET,
        redirect_uri: `${config.OAUTH_REDIRECT_BASE}/linear`,
        code,
    };

    const result = await axios({
        method: 'post',
        url: url,
        data: qs.stringify(formData),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    logInfo('OAuth creds for Linear', result.data);
    const query = `query Me {
      viewer {
        id
        name
        email
      }
    }`;

    const info = await axios({
        method: 'post',
        url: 'https://api.linear.app/graphql',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `${result.data.token_type} ${result.data.access_token}`,
        },
        data: JSON.stringify({ query: query }),
    });

    logInfo('OAuth token info', info.data);

    try {
        await xprisma.connections.upsert({
            where: {
                id: tenantId,
            },
            update: {
                tp_access_token: result.data?.access_token,
                tp_refresh_token: null,
                app_client_id: clientId || config.LINEAR_CLIENT_ID,
                app_client_secret: clientSecret || config.LINEAR_CLIENT_SECRET,
                tp_id: integrationId,
                appId: account?.apps[0].id,
                tp_customer_id: String(info.data.viewer?.id),
            },
            create: {
                id: tenantId,
                t_id: tenantId,
                tp_id: integrationId,
                tp_access_token: String(result.data?.access_token),
                app_client_id: clientId || config.LINEAR_CLIENT_ID,
                app_client_secret: clientSecret || config.LINEAR_CLIENT_SECRET,
                tp_customer_id: String(info.data.viewer?.id),
                owner_account_public_token: revertPublicKey,
                appId: account?.apps[0].id,
                environmentId: environmentId,
            },
        });

        // svix stuff here
        config.svix?.message.create(svixAppId, {
            eventType: 'connection.added',
            payload: {
                eventType: 'connection.added',
                connection: {
                    t_id: tenantId,
                    tp_id: TP_ID.linear,
                    tp_access_token: result.data.access_token,
                    tp_customer_id: info.data.viewer?.id,
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
        return response.send({ status: 'ok', tp_customer_id: info.data.viewer?.id });
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

export default handleLinearAuth;
