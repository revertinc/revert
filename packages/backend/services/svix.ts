import config from '../config';
import prisma from '../prisma/client';
class SvixService {
    // clerk userId
    async deleteAssociatedSvixAccountForUser(userId: string): Promise<any> {
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
            await config.svix?.application.delete(svixId);
        });
    }
}

export default new SvixService();
