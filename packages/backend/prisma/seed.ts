import { PrismaClient, TP_ID } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const localAccount = await prisma.accounts.upsert({
        where: { id: 'localAccount' },
        update: {},
        create: {
            id: 'localAccount',
            private_token: 'localPrivateToken',
            public_token: 'localPublicToken',
            tenant_count: 0,
        },
    });
    await Promise.all(
        Object.keys(TP_ID).map(async (tp) => {
            const localRevertApp = await prisma.apps.create({
                data: {
                    id: `${tp}_${localAccount.id}`,
                    tp_id: tp as TP_ID,
                    scope: [],
                    owner_account_public_token: localAccount.public_token,
                    is_revert_app: true,
                },
            });
            console.log({ localAccount, localRevertApp });
        })
    );
}
main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
