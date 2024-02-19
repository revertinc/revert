import prisma from '../prisma/client';
import { MetadataService } from '../generated/typescript/api/resources/metadata/service/MetadataService';
import { CrmMetadata } from '../generated/typescript/api';
import { InternalServerError, UnAuthorizedError } from '../generated/typescript/api/resources/common';
import { logError } from '../helpers/logger';
import config from '../config';
import { TP_ID, apps } from '@prisma/client';
import { DEFAULT_SCOPE } from '../constants/common';

const metadataService = new MetadataService({
    async getCrms(req, res) {
        const { 'x-revert-public-token': token } = req.headers;
        if (!token) {
            throw new UnAuthorizedError({ error: 'Api token unauthorized' });
        }

        try {
            const apps = await prisma.apps.findMany({
                select: { scope: true, app_client_id: true, tp_id: true, env: { include: { accounts: true } } },
                where: {
                    env: {
                        public_token: token as string,
                    },
                },
            });
            if (!apps || !apps.length) {
                throw new UnAuthorizedError({
                    error: 'Api token unauthorized',
                });
            }
            res.locals.account = apps?.[0].env.accounts;
            const getScope = (apps: Partial<apps>[], integration: TP_ID) => {
                const app = apps.find((app) => app.tp_id === integration);
                const scopes = app?.is_revert_app ? [] : app?.scope;
                return scopes?.length ? scopes : DEFAULT_SCOPE[integration];
            };
            const getClientId = (apps: Partial<apps>[], integration: TP_ID) => {
                const app = apps.find((app) => app.tp_id === integration);
                return app?.is_revert_app ? undefined : app?.app_client_id;
            };
            let crms: Array<CrmMetadata> = [
                {
                    integrationId: TP_ID.hubspot,
                    name: 'Hubspot',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1691139212/Revert/image_57_krrplr.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.hubspot),
                    clientId: getClientId(apps, TP_ID.hubspot) || config.HUBSPOT_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.zohocrm,
                    name: 'Zoho CRM',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1691139213/Revert/image_62_bzxn4z.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.zohocrm),
                    clientId: getClientId(apps, TP_ID.zohocrm) || config.ZOHOCRM_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.sfdc,
                    name: 'Salesforce',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1691139212/Revert/image_61_svyhd9.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.sfdc),
                    clientId: getClientId(apps, TP_ID.sfdc) || config.SFDC_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.pipedrive,
                    name: 'Pipedrive',
                    imageSrc: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1691141825/Revert/pngegg_mhbvfc.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.pipedrive),
                    clientId: getClientId(apps, TP_ID.pipedrive) || config.PIPEDRIVE_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.closecrm,
                    name: 'Close',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/c_scale,w_136/Revert/o8kv3xqzoqioupz0jpnl.jpg',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.closecrm),
                    clientId: getClientId(apps, TP_ID.closecrm) || config.CLOSECRM_CLIENT_ID,
                },
                {
                    integrationId: 'slack',
                    name: 'slack',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1697800999/Revert/sr7ikiijgzsmednoeil0.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.slack),
                    clientId: getClientId(apps, TP_ID.slack) || config.SLACK_CLIENT_ID,
                },
                {
                    integrationId: 'discord',
                    name: 'discord',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/c_scale,w_136/v1701337535/Revert/qorqmz5ggxbb5ckywmxm.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.discord),
                    clientId: getClientId(apps, TP_ID.discord) || config.DISCORD_CLIENT_ID,
                },
                // @TODO add cloudinary links
                {
                    integrationId: TP_ID.linear,
                    name: 'Linear',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/c_scale,w_100/v1702974919/Revert/v5e5z6afm5iepiy3cvex.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.linear),
                    clientId: getClientId(apps, TP_ID.linear) || config.LINEAR_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.clickup,
                    name: 'Clickup',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/c_scale,w_100/v1702974919/Revert/zckjrxorttrrmyuxf1hu.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.clickup),
                    clientId: getClientId(apps, TP_ID.clickup) || config.CLICKUP_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.jira,
                    name: 'Jira',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1702983006/Revert/szfzkoagws7h3miptezo.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.jira),
                    clientId: getClientId(apps, TP_ID.jira) || config.JIRA_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.trello,
                    name: 'Trello',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1705315257/Revert/abt6asvtvdqhzgadanwx.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.trello),
                    clientId: getClientId(apps, TP_ID.trello) || config.TRELLO_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.ms_dynamics_365_sales,
                    name: 'microsoft dynamics 365',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1707715552/Revert/mecum34mxpxirpi1obxd.png',
                    status: 'active',
                    scopes: getScope(apps, TP_ID.ms_dynamics_365_sales),
                    clientId: getClientId(apps, TP_ID.ms_dynamics_365_sales) || config.MS_DYNAMICS_SALES_CLIENT_ID,
                },
                {
                    integrationId: TP_ID.plane,
                    name: 'Plane',
                    imageSrc: `data:image/png;base64,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`,
                    status: 'active',
                    scopes: [],
                    authType: 'ApiKey',
                },
            ];
            res.send({
                status: 'ok',
                data: crms,
            });
        } catch (error: any) {
            logError(error);
            console.error('Could not get metadata', token, error);
            throw new InternalServerError({ error: 'Internal server error' });
        }
    },
});

export { metadataService };
