import dotenv from 'dotenv';
import { Svix } from 'svix';

dotenv.config();

const config = {
    PORT: process.env.SERVER_PORT || 4001,
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
    svix: process.env.SVIX_AUTH_TOKEN ? new Svix(process.env.SVIX_AUTH_TOKEN!) : undefined,
    WHITE_LISTED_DOMAINS: process.env.WHITE_LISTED_DOMAINS?.split(','),
    AES_ENCRYPTION_SECRET: process.env.AES_ENCRYPTION_SECRET!,
    SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID!,
    SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET!,
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN!,
};

export default config;
