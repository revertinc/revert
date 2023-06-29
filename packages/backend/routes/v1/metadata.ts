import express from 'express';
import prisma from '../../prisma/client';
import { DEFAULT_SCOPE, INTEGRATIONS } from '../../constants';
import { apps } from '@prisma/client';
import config from '../../config';

const metadataRouter = express.Router();

metadataRouter.get('/crms', async (req, res) => {
    const { 'x-revert-public-token': token } = req.headers;

    if (!token) {
        res.status(401).send({
            error: 'Api token unauthorized',
        });
        return;
    }
    try {
        const apps = await prisma.apps.findMany({
            select: { scope: true, app_client_id: true, tp_id: true },
            where: {
                owner_account_public_token: token as string,
            },
        });
        if (!apps || !apps.length) {
            res.status(401).send({
                error: 'Api token unauthorized',
            });

            return;
        }
        const getScope = (apps: Partial<apps>[], integration: INTEGRATIONS) => {
            return apps.find((app) => app.tp_id === integration)?.scope || DEFAULT_SCOPE[integration];
        };
        const getClientId = (apps: Partial<apps>[], integration: INTEGRATIONS) => {
            return apps.find((app) => app.tp_id === integration)?.app_client_id;
        };
        res.send({
            status: 'ok',
            data: [
                {
                    integrationId: INTEGRATIONS.HUBSPOT,
                    name: 'Hubspot',
                    imageSrc: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1673863171/Revert/Hubspot%20logo.png',
                    status: 'active',
                    scopes: getScope(apps, INTEGRATIONS.HUBSPOT),
                    clientId: getClientId(apps, INTEGRATIONS.HUBSPOT) || config.HUBSPOT_CLIENT_ID,
                },
                {
                    integrationId: INTEGRATIONS.ZOHO,
                    name: 'Zoho CRM',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1674053823/Revert/zoho-crm-logo_u9889x.jpg',
                    status: 'active',
                    scopes: getScope(apps, INTEGRATIONS.ZOHO),
                    clientId: getClientId(apps, INTEGRATIONS.ZOHO) || config.ZOHOCRM_CLIENT_ID,
                },
                {
                    integrationId: INTEGRATIONS.SALESFORCE,
                    name: 'Salesforce',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/c_fit,h_20,w_70/v1673887647/Revert/SFDC%20logo.png',
                    status: 'active',
                    scopes: getScope(apps, INTEGRATIONS.SALESFORCE),
                    clientId: getClientId(apps, INTEGRATIONS.SALESFORCE) || config.SFDC_CLIENT_ID,
                },
            ],
        });
    } catch (error) {
        console.error('Could not update db', error);
    }
});

export default metadataRouter;
