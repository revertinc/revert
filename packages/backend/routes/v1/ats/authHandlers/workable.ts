import { TP_ID } from '@prisma/client';
import { IntegrationAuthProps, mapIntegrationIdToIntegrationName, AppConfig } from '../../../../constants/common';
import processOAuthResult from '../../../../helpers/auth/processOAuthResult';
import sendConnectionAddedEvent from '../../../../helpers/webhooks/connection';
import BaseOAuthHandler from '../../../../helpers/auth/baseOAuthHandler';
import { xprisma } from '../../../../prisma/client';

class WorkableAuthHandler extends BaseOAuthHandler {
    async handleBasicAuth({
        account,
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
        const accountUrl = (account?.apps[0]?.app_config as AppConfig | undefined)?.org_url;
        const tpCustomerId = accountUrl || 'Workable user';

        try {
            await xprisma.connections.upsert({
                where: {
                    id: tenantId,
                },
                update: {
                    tp_access_token: code,
                    tp_refresh_token: null,
                    app_client_id: null,
                    app_client_secret: null,
                    tp_id: integrationId,
                    appId: account?.apps[0].id,
                    tp_customer_id: tpCustomerId,
                    tp_account_url: accountUrl,
                },
                create: {
                    id: tenantId,
                    t_id: tenantId,
                    tp_id: integrationId,
                    tp_access_token: code,
                    tp_refresh_token: null,
                    app_client_id: null,
                    app_client_secret: null,
                    tp_customer_id: tpCustomerId,
                    tp_account_url: accountUrl,
                    owner_account_public_token: revertPublicKey,
                    appId: account?.apps[0].id,
                    environmentId: environmentId,
                },
            });

            await sendConnectionAddedEvent(svixAppId, tenantId, TP_ID.workable, code, tpCustomerId);

            return processOAuthResult({
                status: true,
                revertPublicKey,
                tenantSecretToken,
                response,
                tenantId,
                integrationName: mapIntegrationIdToIntegrationName[integrationId],
                tpCustomerId,
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
