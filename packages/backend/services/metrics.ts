import axios from 'axios';
import prisma from '../prisma/client';
import logger, { logError } from '../helpers/logger';
import ip from 'ip';
class MetricsService {
    async collectAndPublishMetrics() {
        try {
            const numberOfConnections = await prisma.connections.count();
            const numberOfAccounts = await prisma.accounts.count();
            const numberOfUsers = await prisma.users.count();
            const ipAddress = ip.address();
            const metadata = {
                numberOfConnections,
                numberOfAccounts,
                numberOfUsers,
                ipAddress,
            };
            logger.info('collected metrics', metadata);
            await axios({
                url: 'https://api.revert.dev/internal/telemetry',
                method: 'POST',
                data: JSON.stringify(metadata),
            });
        } catch (error: any) {
            logError(error);
            console.error('Could not publish telemetry data', error);
        }
    }
}

export default new MetricsService();
