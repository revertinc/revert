import { TP_ID } from '@prisma/client';
import prisma from '../prisma/client';

class AppService {
    async createRevertAppForAccount({
        accountId,
        tpId,
        environment,
    }: {
        accountId: string;
        tpId: TP_ID;
        environment: string;
    }): Promise<any> {
        const id = `${tpId}_${accountId}_${environment}`;
        const environmentId = `${accountId}_${environment}`;
        try {
            const createdApp = await prisma.apps.create({
                data: {
                    id,
                    tp_id: tpId,
                    scope: [],
                    is_revert_app: true,
                    environmentId,
                },
            });
            return createdApp;
        } catch (error: any) {
            return { error: 'Something went wrong while creating app' };
        }
    }
}

export default new AppService();
