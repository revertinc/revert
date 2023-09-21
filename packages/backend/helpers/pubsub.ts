import { createClient } from 'redis';
import config from '../config';

const subscribe = async (channelName: string, callback: any) => {
    const subscriber = createClient({ url: config.REDIS_URL });
    await subscriber.connect();
    await subscriber.subscribe(channelName, callback);
};

const publish = async (channelName: string, data: any) => {
    const publisher = createClient({ url: config.REDIS_URL });
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
    privateToken?: string;
    status: "SUCCESS" | "FAILED";
    integrationName: string;
    tenantId: string;
}
