import { z } from 'zod';

export const envSchema = z.object({
  WORKDAY_CLIENT_ID: z.string(),
  WORKDAY_CLIENT_SECRET: z.string(),
  WORKDAY_REDIRECT_URI: z.string(),
  WORKDAY_AUTH_URL: z.string(),
  WORKDAY_TOKEN_URL: z.string(),
  WORKDAY_API_URL: z.string(),
});

export const env = envSchema.parse(process.env);
