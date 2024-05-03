import { TP_ID } from '@prisma/client';
import prisma from '../prisma/client';

class AppService {
    async createRevertAppForAccount({
        userId,
        tpId,
        environment,
    }: {
        userId: string;
        tpId: TP_ID;
        environment: string;
    }): Promise<any> {
        const id = `${tpId}_${userId}_${environment}`;
        const environmentId = `${userId}_${environment}`;
        try {
            const createdApp = await prisma.apps.upsert({
                where: {
                    id,
                },
                update: {},
                create: {
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
