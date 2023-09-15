import { createClient } from 'redis';
import config from '../config';

const client = createClient({ url: config.REDIS_URL });

client.connect();

export default client;
