import { createClient } from 'redis';
import config from '../../config';
import { logInfo, logWarn } from '../../helpers/logger';

let client = createRedisClient(config.REDIS_URL);

function createRedisClient(url: string) {
    const newClient = createClient({ url: url });

    newClient.on('error', (error) => {
        // Handle the error gracefully, e.g., log it or perform necessary cleanup.
        logWarn(error);
        // Attempt to re-create the Redis client after a delay (e.g., 5 seconds).
        setTimeout(() => {
            client = createRedisClient(url);
        }, 5000);
    });

    newClient.on('connect', () => {
        logInfo('Connected to Redis');
    });

    return newClient;
}

client.connect();

export { createRedisClient };
export default client;
