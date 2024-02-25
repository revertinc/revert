import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { logInfo } from '../../../../helpers/logger';
import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import handleIntegrationCreationOutcome from '../../handleIntegrationCreationOutcome';

const handlePipeDriveAuth = async ({
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
    const url = 'https://oauth.pipedrive.com/oauth/token';
    const formData = {
        grant_type: 'authorization_code',
        redirect_uri: `${config.OAUTH_REDIRECT_BASE}/pipedrive`,
        code,
    };
    // TODO: Add proper types
    const result = await axios({
        method: 'post',
        url: url,
        data: qs.stringify(formData),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            Authorization: `Basic ${Buffer.from(
                `${clientId || config.PIPEDRIVE_CLIENT_ID}:${clientSecret || config.PIPEDRIVE_CLIENT_SECRET}`
            ).toString('base64')}`,
        },
    });
    logInfo('OAuth creds for pipedrive', result.data);
    const info = await axios({
        method: 'get',
        url: `${result.data.api_domain}/users/me`,
        headers: {
            Authorization: `Bearer ${result.data.access_token}`,
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
                app_client_id: clientId || config.PIPEDRIVE_CLIENT_ID,
                app_client_secret: clientSecret || config.PIPEDRIVE_CLIENT_SECRET,
                tp_id: integrationId,
                appId: account?.apps[0].id,
                tp_customer_id: info.data.data.email,
                tp_account_url: result.data.api_domain,
            },
            create: {
                id: tenantId,
                t_id: tenantId,
                tp_id: integrationId,
                tp_access_token: result.data.access_token,
                tp_refresh_token: result.data.refresh_token,
                tp_customer_id: info.data.data.email,
                owner_account_public_token: revertPublicKey,
                tp_account_url: result.data.api_domain,
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
                    tp_id: TP_ID.pipedrive,
                    tp_access_token: result.data.access_token,
                    tp_customer_id: info.data.data.email,
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
            tpCustomerId: info.data.data.email,
        });
    } catch (error) {
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

export default handlePipeDriveAuth;
