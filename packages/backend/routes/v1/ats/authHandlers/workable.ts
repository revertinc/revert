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

export const normalizeWorkableBaseUrl = (orgUrl?: string | null, subdomain?: string | null): string => {
    if (orgUrl && orgUrl.trim()) {
        const trimmed = orgUrl.trim().replace(/\/+$/, '');
        if (/^https?:\/\//i.test(trimmed)) {
            return trimmed;
        }
        if (trimmed.includes('.workable.com')) {
            return `https://${trimmed}`;
        }
        return `https://${trimmed}.workable.com`;
    }
    if (subdomain && subdomain.trim()) {
        return `https://${subdomain.trim()}.workable.com`;
    }
    return 'https://www.workable.com';
};

class WorkableAuthHandler extends BaseOAuthHandler {
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
        try {
            const configuredOrgUrl = (account?.apps[0]?.app_config as AppConfig)?.org_url;
            const formData = {
                grant_type: 'authorization_code',
                client_id: clientId || config.WORKABLE_CLIENT_ID,
                client_secret: clientSecret || config.WORKABLE_CLIENT_SECRET,
                code,
                redirect_uri: `${config.OAUTH_REDIRECT_BASE}/workable`,
            };

            const result: any = await axios({
                method: 'post',
                url: 'https://www.workable.com/oauth/token',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json',
                },
                data: qs.stringify(formData),
            });

            logInfo('OAuth creds for Workable', result.data);

            const accessToken = result.data.access_token;
            const refreshToken = result.data.refresh_token || null;

            let accountSubdomain: string | undefined;
            let customerId = 'Workable_user';

            try {
                const accountsResult: any = await axios({
                    method: 'get',
                    url: 'https://www.workable.com/spi/v3/accounts',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: 'application/json',
                    },
                });
                const firstAccount = accountsResult?.data?.accounts?.[0];
                if (firstAccount?.subdomain) {
                    accountSubdomain = firstAccount.subdomain;
                }
                if (firstAccount?.id || firstAccount?.subdomain) {
                    customerId = String(firstAccount.id || firstAccount.subdomain);
                }
            } catch (_err) {
                // Fallback to configured org_url if accounts lookup is unavailable
            }

            const tpAccountUrl = normalizeWorkableBaseUrl(configuredOrgUrl, accountSubdomain);

            await xprisma.connections.upsert({
                where: {
                    id: tenantId,
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: accessToken,
                    tp_refresh_token: refreshToken,
                    tp_customer_id: customerId,
                    tp_account_url: tpAccountUrl,
                    app_client_id: clientId || config.WORKABLE_CLIENT_ID,
                    app_client_secret: clientSecret || config.WORKABLE_CLIENT_SECRET,
                    app_config: { org_url: tpAccountUrl },
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0]?.id,
                    environmentId,
                },
                update: {
                    tp_access_token: accessToken,
                    tp_refresh_token: refreshToken,
                    tp_customer_id: customerId,
                    tp_account_url: tpAccountUrl,
                    app_client_id: clientId || config.WORKABLE_CLIENT_ID,
                    app_client_secret: clientSecret || config.WORKABLE_CLIENT_SECRET,
                    app_config: { org_url: tpAccountUrl },
                    tp_id: integrationId,
                    appId: account?.apps[0]?.id,
                },
            });

            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workable, accessToken, customerId);

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId: customerId,
                redirectUrl,
            });
        } catch (error: any) {
            return processOAuthResult({
                status: false,
                error,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                redirectUrl,
            });
        }
    }
}

export default new WorkableAuthHandler();
