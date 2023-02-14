import dotenv from "dotenv";

dotenv.config();

const config = {
  PORT: process.env.SERVER_PORT,
  MONGO_URL: process.env.MONGO_URL!,
  DATABASE: process.env.MONGO_DATABASE,
  REDIS_URL: process.env.REDIS_SERVER_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  HUBSPOT_CLIENT_ID: process.env.HUBSPOT_CLIENT_ID,
  HUBSPOT_CLIENT_SECRET: process.env.HUBSPOT_CLIENT_SECRET,
  ZOHOCRM_CLIENT_ID: process.env.ZOHOCRM_CLIENT_ID,
  ZOHOCRM_CLIENT_SECRET: process.env.ZOHOCRM_CLIENT_SECRET,
  SFDC_CLIENT_ID: process.env.SFDC_CLIENT_ID,
  SFDC_CLIENT_SECRET: process.env.SFDC_CLIENT_SECRET,
  PGSQL_URL: process.env.PGSQL_URL,
  OAUTH_REDIRECT_BASE: process.env.OAUTH_REDIRECT_BASE,
};

export default config;
