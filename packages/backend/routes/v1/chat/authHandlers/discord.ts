import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { logInfo } from '../../../../helpers/logger';
import { xprisma } from '../../../../prisma/client';
import { TP_ID } from '@prisma/client';
import { AppConfig, IntegrationAuthProps, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';

class DiscordAuthHandler extends BaseOAuthHandler {
    async handleOAuth({
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
        redirectUrl,
    }: IntegrationAuthProps) {
        const botToken = account?.apps[0]?.is_revert_app
            ? undefined
            : (account?.apps[0]?.app_config as AppConfig).bot_token;

        const formData = {
            client_id: clientId || config.DISCORD_CLIENT_ID,
            client_secret: clientSecret || config.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: `${config.OAUTH_REDIRECT_BASE}/discord`,
        };

        const result = await axios.post('https://discord.com/api/oauth2/token', qs.stringify(formData));

        logInfo('OAuth creds for discord', result.data);

        const info = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${result.data.token_type} ${result.data.access_token}`,
            },
        });
        logInfo('OAuth token info', info.data);
        const guildId = result.data?.guild?.id;
        try {
            await xprisma.connections.upsert({
                where: {
                    id: tenantId,
                },
                update: {
                    tp_access_token: result.data?.access_token,
                    tp_refresh_token: result.data?.refresh_token,
                    app_client_id: clientId || config.DISCORD_CLIENT_ID,
                    app_client_secret: clientSecret || config.DISCORD_CLIENT_SECRET,
                    app_config: { bot_token: botToken || config.DISCORD_BOT_TOKEN },
                    tp_id: integrationId,
                    appId: account?.apps[0].id,
                    tp_customer_id: guildId,
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: String(result.data?.access_token),
                    tp_refresh_token: String(result.data?.refresh_token),
                    app_client_id: clientId || config.DISCORD_CLIENT_ID,
                    app_client_secret: clientSecret || config.DISCORD_CLIENT_SECRET,
                    app_config: { bot_token: botToken || config.DISCORD_BOT_TOKEN },
                    tp_customer_id: guildId,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId: environmentId,
                },
            });

            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.discord, result.data.access_token, guildId);

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: info.data.id,
                redirectUrl,
            });
        } catch (error: any) {
            return processOAuthResult({
                status: false,
                error,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId: tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                redirectUrl,
            });
        }
    }
}

export default new DiscordAuthHandler();
