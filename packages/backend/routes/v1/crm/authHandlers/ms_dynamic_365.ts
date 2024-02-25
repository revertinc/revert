import axios from 'axios';
import config from '../../../../config';
import { logInfo } from '../../../../helpers/logger';
import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';

import { AppConfig, IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import handleIntegrationCreationOutcome from '../../handleIntegrationCreationOutcome';

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

        return handleIntegrationCreationOutcome({
            status: true,
            revertPublicKey,
            tenantSecretToken,
            response,
            tenantId: tenantId,
            integrationName: mapIntegrationIdToIntegrationName[integrationId],
            tpCustomerId: info.data.UserId,
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

export default handleMsDynamicAuth;
