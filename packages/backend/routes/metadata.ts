import express from 'express';
import prisma from '../prisma/client';

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
        const account = await prisma.accounts.findMany({
            where: {
                x_revert_public_token: token as string,
            },
        });
        if (!account || !account.length) {
            res.status(401).send({
                error: 'Api token unauthorized',
            });

            return;
        }
        res.send({
            status: 'ok',
            data: [
                {
                    integrationId: 'hubspot',
                    name: 'Hubspot',
                    imageSrc: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1673863171/Revert/Hubspot%20logo.png',
                    status: 'active',
                },
                {
                    integrationId: 'zohocrm',
                    name: 'Zoho CRM',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1674053823/Revert/zoho-crm-logo_u9889x.jpg',
                    status: 'active',
                },
                {
                    integrationId: 'sfdc',
                    name: 'Salesforce',
                    imageSrc:
                        'https://res.cloudinary.com/dfcnic8wq/image/upload/c_fit,h_20,w_70/v1673887647/Revert/SFDC%20logo.png',
                    status: 'active',
                },
            ],
        });
    } catch (error) {
        console.error('Could not update db', error);
    }
});

export default metadataRouter;
