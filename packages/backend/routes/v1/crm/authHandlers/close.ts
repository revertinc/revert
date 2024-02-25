import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { logInfo } from '../../../../helpers/logger';
import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import handleIntegrationCreationOutcome from '../../handleIntegrationCreationOutcome';

const handleCloseAuth = async ({
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
        client_id: clientId || config.CLOSECRM_CLIENT_ID,
        client_secret: clientSecret || config.CLOSECRM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
    };

    const result = await axios({
        method: 'post',
        url: 'https://api.close.com/oauth2/token/',
        data: qs.stringify(formData),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    logInfo('OAuth creds for close crm', result.data);

    const info = await axios({
        method: 'get',
        url: 'https://api.close.com/api/v1/me/',
        headers: {
            Authorization: `Bearer ${result.data.access_token}`,
            Accept: 'application/json',
        },
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
                tp_customer_id: info.data.email,
            },
            create: {
                id: tenantId,
                t_id: tenantId,
                tp_id: integrationId,
                tp_access_token: result.data.access_token,
                tp_refresh_token: result.data.refresh_token,
                app_client_id: clientId || config.HUBSPOT_CLIENT_ID,
                app_client_secret: clientSecret || config.HUBSPOT_CLIENT_SECRET, // TODO: Fix in other platforms.
                tp_customer_id: info.data.email,
                owner_account_public_token: revertPublicKey,
                appId: account?.apps[0].id,
                environmentId: environmentId,
            },
        });

        // SVIX webhook
        config.svix?.message.create(svixAppId, {
            eventType: 'connection.added',
            payload: {
                eventType: 'connection.added',
                connection: {
                    t_id: tenantId,
                    tp_id: TP_ID.closecrm,
                    tp_access_token: result.data.access_token,
                    tp_customer_id: info.data.email,
                },
            },
            channels: [tenantId],
        });

        return handleIntegrationCreationOutcome({
            status: true,
            revertPublicKey,
            tenantSecretToken,
            response,
            tenantId: tenantId,
            integrationName: mapIntegrationIdToIntegrationName[integrationId],
            tpCustomerId: info.data.email,
        });
    } catch (error: any) {
        return handleIntegrationCreationOutcome({
            status: false,
            error,
            revertPublicKey,
            tenantSecretToken,
            response,
            tenantId: tenantId,
            integrationName: mapIntegrationIdToIntegrationName[integrationId],
        });
    }
};

export default handleCloseAuth;
