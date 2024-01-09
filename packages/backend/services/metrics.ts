import axios from 'axios';
import prisma from '../prisma/client';
import { logError } from '../helpers/logger';
import ip from 'ip';
class MetricsService {
    async collectAndPublishMetrics() {
        try {
            const numberOfConnections = await prisma.connections.count();
            const numberOfAccounts = await prisma.accounts.count();
            const numberOfUsers = await prisma.users.count();
            const ipAddress = ip.address('public');
            const metadata = {
                numberOfConnections,
                numberOfAccounts,
                numberOfUsers,
                ipAddress,
            };
            await axios({
                url: 'https://api-gateway.revert.dev/telemetry',
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
