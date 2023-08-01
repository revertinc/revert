import dotenv from 'dotenv';
import { Svix } from 'svix';

dotenv.config();

const config = {
    PORT: process.env.SERVER_PORT,
    DATABASE: process.env.MONGO_DATABASE,
    REDIS_URL: process.env.REDIS_SERVER_URL,
    HUBSPOT_CLIENT_ID: process.env.HUBSPOT_CLIENT_ID,
    HUBSPOT_CLIENT_SECRET: process.env.HUBSPOT_CLIENT_SECRET,
    ZOHOCRM_CLIENT_ID: process.env.ZOHOCRM_CLIENT_ID,
    ZOHOCRM_CLIENT_SECRET: process.env.ZOHOCRM_CLIENT_SECRET,
    SFDC_CLIENT_ID: process.env.SFDC_CLIENT_ID,
    SFDC_CLIENT_SECRET: process.env.SFDC_CLIENT_SECRET,
    PIPEDRIVE_CLIENT_ID: process.env.PIPEDRIVE_CLIENT_ID,
    PIPEDRIVE_CLIENT_SECRET: process.env.PIPEDRIVE_CLIENT_SECRET,
    PGSQL_URL: process.env.PGSQL_URL,
    OAUTH_REDIRECT_BASE: process.env.OAUTH_REDIRECT_BASE,
    SLACK_URL: process.env.SLACK_HOOK_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SVIX_AUTH_TOKEN: process.env.SVIX_AUTH_TOKEN,
    SHORTLOOP_AUTH_KEY: process.env.SHORTLOOP_AUTH_KEY!,
    SVIX_ENDPOINT_SECRET: process.env.SVIX_ENDPOINT_SECRET!,
    svix: new Svix(process.env.SVIX_AUTH_TOKEN!),
};

export default config;
