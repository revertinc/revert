import config from '../../../../config';
import { logInfo, logError } from '../../../../helpers/logger';
import { Prisma, xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../../../redis/client/pubsub';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import sendIntegrationStatusError from '../../sendIntegrationstatusError';
import axios from 'axios';

const handleJiraAuth = async ({
    account,
    clientId,
    clientSecret,
    integrationId,
    revertPublicKey,
    svixAppId,
    environmentId,
    tenantId,
    tenantSecretToken,
    response,
    code,
}: IntegrationAuthProps) => {
    const formData = {
        grant_type: 'authorization_code',
        client_id: clientId || config.JIRA_CLIENT_ID,
        client_secret: clientSecret || config.JIRA_CLIENT_SECRET,
        code,
        redirect_uri: `${config.OAUTH_REDIRECT_BASE}/jira`,
    };

    const result: any = await axios({
        method: 'post',
        url: 'https://auth.atlassian.com/oauth/token',
        headers: {
            'Content-Type': 'application/json',
        },
        data: formData,
    });
    const auth = 'Bearer ' + result.data.access_token;
    logInfo('OAuth creds for jira', result.data);

    // fetch the cloud id, required for further requests
    const resources = await axios({
        method: 'get',
        url: 'https://api.atlassian.com/oauth/token/accessible-resources',
        headers: {
            Accept: 'application/json',
            Authorization: auth,
        },
    });
    let cloud_id = undefined;

    if (resources.data && Array.isArray(resources.data) && resources.data.length > 0) {
        cloud_id = resources.data[0].id;
    } else {
        throw new Error('Unable to fetch cloud_id for jira token');
    }

    const jiraBaseUrl = `https://api.atlassian.com/ex/jira/${cloud_id}`;

    // fetch user info
    const info = await axios({
        method: 'get',
        url: `${jiraBaseUrl}/rest/api/2/myself`,
        headers: {
            Accept: 'application/json',
            Authorization: auth,
        },
    });
    logInfo('User info', info.data);
    const accountId = info.data?.accountId;

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
                tp_customer_id: accountId,
                tp_account_url: jiraBaseUrl as string,
                app_client_id: clientId || config.JIRA_CLIENT_ID,
                app_client_secret: clientSecret || config.JIRA_CLIENT_SECRET,
                owner_account_public_token: revertPublicKey,
                appId: account?.apps[0].id,
                environmentId: environmentId,
            },
            update: {
                tp_access_token: result.data.access_token,
                tp_refresh_token: result.data.refresh_token,
                app_client_id: clientId || config.JIRA_CLIENT_ID,
                app_client_secret: clientSecret || config.JIRA_CLIENT_SECRET,
                tp_id: integrationId,
                appId: account?.apps[0].id,
                tp_customer_id: accountId,
                tp_account_url: jiraBaseUrl as string,
            },
        });

        config.svix?.message.create(svixAppId, {
            eventType: 'connection.added',
            payload: {
                eventType: 'connection.added',
                connection: {
                    t_id: tenantId,
                    tp_id: TP_ID.trello,
                    tp_access_token: result.data.access_token,
                    tp_refresh_token: result.data.refresh_token,
                    tp_customer_id: accountId,
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
        return response.send({ status: 'ok', tp_customer_id: accountId });
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

export default handleJiraAuth;
