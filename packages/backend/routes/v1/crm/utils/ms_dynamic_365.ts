import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { logInfo, logError } from '../../../../helpers/logger';
import { Prisma, xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../../../redis/client/pubsub';
import { AppConfig, IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import sendIntegrationStatusError from '../../sendIntegrationstatusError';

const handleMsDynamicAuth = async ({
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
    let orgURL = account?.apps[0]?.is_revert_app ? undefined : (account?.apps[0]?.app_config as AppConfig)?.org_url;
    if (!orgURL) orgURL = config.MS_DYNAMICS_SALES_ORG_URL;
    let formData: any = {
        client_id: clientId || config.MS_DYNAMICS_SALES_CLIENT_ID,
        client_secret: clientSecret || config.MS_DYNAMICS_SALES_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.OAUTH_REDIRECT_BASE ? encodeURI(config.OAUTH_REDIRECT_BASE + `/${integrationId}`) : null,
        scope: `${orgURL}/.default`,
    };
    formData = new URLSearchParams(formData);

    const result = await axios({
        method: 'post',
        url: `https://login.microsoftonline.com/organizations/oauth2/v2.0/token`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: formData,
    });
    logInfo('OAuth creds for Microsoft Dynamics 365 sales', result.data);

    const info: any = await axios({
        method: 'get',
        url: `${orgURL}/api/data/v9.2/WhoAmI`,
        headers: {
            Authorization: `Bearer ${result.data.access_token}`,
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
        },
    });
    logInfo('OAuth token info', 'info', info.data);

    try {
        await xprisma.connections.upsert({
            where: {
                id: tenantId,
            },
            update: {
                tp_id: integrationId,
                tp_access_token: result.data.access_token,
                tp_refresh_token: result.data.refresh_token,
                tp_customer_id: info.data.UserId,
                tp_account_url: orgURL,
                app_client_id: clientId || config.MS_DYNAMICS_SALES_CLIENT_ID,
                app_client_secret: clientSecret || config.MS_DYNAMICS_SALES_CLIENT_SECRET,
                app_config: { org_url: orgURL || config.MS_DYNAMICS_SALES_ORG_URL },
                appId: account?.apps[0].id,
            },
            create: {
                id: tenantId,
                t_id: tenantId,
                tp_id: integrationId,
                tp_access_token: result.data.access_token,
                tp_refresh_token: result.data.refresh_token,
                tp_customer_id: info.data.UserId,
                tp_account_url: orgURL,
                app_client_id: clientId || config.MS_DYNAMICS_SALES_CLIENT_ID,
                app_client_secret: clientSecret || config.MS_DYNAMICS_SALES_CLIENT_SECRET,
                app_config: { org_url: orgURL || config.MS_DYNAMICS_SALES_ORG_URL },
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
                    tp_id: TP_ID.ms_dynamics_365_sales,
                    tp_access_token: result.data.access_token,
                    tp_customer_id: info.data.UserId,
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
        return response.send({ status: 'ok', tp_customer_id: info.data.UserId });
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

export default handleMsDynamicAuth;
