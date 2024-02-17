import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { logInfo, logError } from '../../../../helpers/logger';
import { Prisma, xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../../../redis/client/pubsub';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import sendIntegrationStatusError from '../../sendIntegrationstatusError';

const handleClickUpAuth = async ({
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
    const formData = {
        client_id: clientId || config.CLICKUP_CLIENT_ID,
        client_secret: clientSecret || config.CLICKUP_CLIENT_SECRET,
        code,
    };
    logInfo('client credentials ', formData);
    const result = await axios({
        method: 'post',
        url: 'https://api.clickup.com/api/v2/oauth/token',
        data: qs.stringify(formData),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    logInfo('OAuth creds for Clickup', result.data);

    const info = await axios({
        method: 'get',
        url: 'https://api.clickup.com/api/v2/user',
        headers: {
            Authorization: `${result.data?.token_type} ${result.data.access_token}`,
        },
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
                app_client_id: clientId || config.CLICKUP_CLIENT_ID,
                app_client_secret: clientSecret || config.CLICKUP_CLIENT_SECRET,
                tp_id: integrationId,
                appId: account?.apps[0].id,
                tp_customer_id: String(info.data?.user?.id),
            },
            create: {
                id: tenantId,
                t_id: tenantId,
                tp_id: integrationId,
                tp_access_token: String(result.data?.access_token),
                app_client_id: clientId || config.CLICKUP_CLIENT_ID,
                app_client_secret: clientSecret || config.CLICKUP_CLIENT_SECRET,
                tp_customer_id: String(info.data?.user?.id),
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
                    tp_id: TP_ID.clickup,
                    tp_access_token: result.data.access_token,
                    tp_customer_id: info.data?.user?.id,
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

        return response.send({ status: 'ok', tp_customer_id: info.data.user.id });
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
            tenantId,
            integrationName: mapIntegrationIdToIntegrationName[integrationId],
        });
    }
};

export default handleClickUpAuth;
