import express from 'express';
import prisma from '../../prisma/client';
import { DEFAULT_SCOPE, INTEGRATIONS } from '../../constants';
import { connections } from '@prisma/client';

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
        const account = await prisma.accounts.findFirst({
            where: {
                public_token: token as string,
            },
            include: { connections: true },
        });
        if (!account) {
            res.status(401).send({
                error: 'Api token unauthorized',
            });

            return;
        }
        const getScope = (connections: connections[], integration: INTEGRATIONS) => {
            return (
                connections.find((connection) => connection.tp_id === integration)?.scope || DEFAULT_SCOPE[integration]
            );
        };
        res.send({
            status: 'ok',
            data: [
                {
                    integrationId: INTEGRATIONS.HUBSPOT,
                    name: 'Hubspot',
                    imageSrc: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1673863171/Revert/Hubspot%20logo.png',
                    status: 'active',
                    scopes: getScope(account.connections, INTEGRATIONS.HUBSPOT),
                },
                {
                    integrationId: INTEGRATIONS.ZOHO,
                    name: 'Zoho CRM',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1674053823/Revert/zoho-crm-logo_u9889x.jpg',
                    status: 'active',
                    scopes: getScope(account.connections, INTEGRATIONS.ZOHO),
                },
                {
                    integrationId: INTEGRATIONS.SALESFORCE,
                    name: 'Salesforce',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/c_fit,h_20,w_70/v1673887647/Revert/SFDC%20logo.png',
                    status: 'active',
                    scopes: getScope(account.connections, INTEGRATIONS.SALESFORCE),
                },
            ],
        });
    } catch (error) {
        console.error('Could not update db', error);
    }
});

export default metadataRouter;
