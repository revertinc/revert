import { PrismaClient } from '@prisma/client';
import { xprisma } from './client';

const prisma = new PrismaClient();

async function main() {
    const allConnections = await xprisma.connections.findMany({
        include: {
            app: {
                select: {
                    environmentId: true,
                    tp_id: true,
                    id: true,
                },
            },
        },
    });

    allConnections.forEach(async (connection) => {
        const environmentId = connection.app?.environmentId;
        const newConnectionId = `${environmentId}_${connection.id}`;
        await prisma.connections.update({
            where: {
                id: connection.id,
            },
            data: {
                id: newConnectionId,
                environmentId: environmentId,
            },
        });
    });
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
