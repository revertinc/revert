import { logError } from 'helpers/logger';
import config from '../config';
import prisma from '../prisma/client';
class SvixService {
    // clerk userId
    async deleteAssociatedSvixAccountForUser(userId: string): Promise<any> {
        try {
            const accountInformation = await prisma.users.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    account: {
                        select: {
                            id: true,
                            environments: {
                                select: {
                                    env: true,
                                },
                            },
                        },
                    },
                },
            });

            const accountId = accountInformation?.account.id!;

            // delete all the associated svixAccount
            accountInformation?.account.environments.map(async (e) => {
                const svixId = `${accountId}_${e.env}`;
                try {
                    await config.svix?.application.delete(svixId);
                } catch (error) {
                    // svixAppId wasn't existing
                }
            });
        } catch (error) {
            logError({
                message: `Error while deleting Associated Svix Account For ${userId}`,
                name: 'SvixAccountDeletion',
            });
        }
    }
}

export default new SvixService();
