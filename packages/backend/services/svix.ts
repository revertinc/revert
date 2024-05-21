import config from '../config';
import prisma from '../prisma/client';
import { logError } from '../helpers/logger';
class SvixService {
    // clerk userId
    async deleteAssociatedSvixAccountForUser(userId: string) {
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

    async createSvixAccount({ accountId, environment }: { accountId: string; environment: string }) {
        try {
            const createdSvixAccount = await config.svix?.application.create({
                name: `${accountId}_${environment}`,
                uid: `${accountId}_${environment}`,
            });
            return createdSvixAccount;
        } catch (error) {
            logError({
                message: `Error while creating Svix Account`,
                name: 'SvixAccountCreation',
            });
            return undefined;
        }
    }
}

export default new SvixService();
