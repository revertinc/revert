import config from '../../config';
import { createRedisClient } from '.';

const subscribe = async (channelName: string, callback: any) => {
    const subscriber = createRedisClient(config.REDIS_URL);
    await subscriber.connect();
    await subscriber.subscribe(channelName, callback);
};

const publish = async (channelName: string, data: any) => {
    const publisher = createRedisClient(config.REDIS_URL);
    await publisher.connect();
    await publisher.publish(channelName, JSON.stringify(data));
};

const pubsub = { publish, subscribe };

export default pubsub;

export const PUBSUB_CHANNELS = {
    INTEGRATION_STATUS: 'integrationStatus',
};

export interface IntegrationStatusSseMessage {
    publicToken: string;
    status: 'SUCCESS' | 'FAILED';
    integrationName: string;
    tenantId: string;
    tenantSecretToken?: string;
    redirectUrl?:string
}
