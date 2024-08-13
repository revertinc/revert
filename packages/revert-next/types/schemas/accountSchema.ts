import { z } from '@revertdotdev/utils';
import { appSchema } from './appSchema';

export const accountSchema = z.object({
    account: z.object({
        id: z.string(),
        tenant_count: z.number(),
        private_token: z.string(),
        public_token: z.string(),
        domain: z.string(),
        skipWaitlist: z.boolean(),
        workspaceName: z.string(),
        environments: z.array(
            z.object({
                id: z.string(),
                env: z.string(),
                private_token: z.string(),
                public_token: z.string(),
                accountId: z.string(),
                apps: appSchema,
            }),
        ),
        isOnboardingCompleted: z.object({
            development: z.boolean(),
            production: z.boolean(),
        }),
    }),
});

export const accountResponseSchema = z.object({
    apps: appSchema,
    isDefaultEnvironment: z.boolean().default(true),
    currentPrivateToken: z.string(),
    currentPublicToken: z.string(),
    prodPrivateToken: z.string(),
    workspaceName: z.string(),
    isOnboardingCompleted: z.boolean().default(false),
});

export type AccountResponseSchema = z.infer<typeof accountResponseSchema>;

export type AccountSchema = z.infer<typeof accountSchema>;
