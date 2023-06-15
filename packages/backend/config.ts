import dotenv from 'dotenv';

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
    PGSQL_URL: process.env.PGSQL_URL,
    OAUTH_REDIRECT_BASE: process.env.OAUTH_REDIRECT_BASE,
    SLACK_URL: process.env.SLACK_HOOK_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
};

export default config;
