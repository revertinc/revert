import prisma from '../prisma/client';
import { MetadataService } from '../generated/typescript/api/resources/metadata/service/MetadataService';
import { CrmMetadata, UnAuthorizedError } from '../generated/typescript/api';

const metadataService = new MetadataService({
    async getCrms(req, res) {
        const { 'x-revert-public-token': token } = req.headers;
        if (!token) {
            throw new UnAuthorizedError({ error: 'Api token unauthorized' });
        }
        const account = await prisma.accounts.findMany({
            where: {
                public_token: token as string,
            },
        });
        if (!account || !account.length) {
            throw new UnAuthorizedError({ error: 'Api token unauthorized' });
        }
        let crms: Array<CrmMetadata> = [
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
        ];
        res.send({
            status: 'ok',
            data: crms,
        });
    },
});

export { metadataService };
