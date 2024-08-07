import { z } from '@revertdotdev/utils';
import { TP_ID } from './commonSchema';

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
                apps: z.array(
                    z.object({
                        id: z.string(),
                        tp_id: TP_ID,
                        scope: z.array(z.string()).optional(),
                        app_client_id: z.string().nullable(),
                        app_client_secret: z.string().nullable(),
                        owner_account_public_token: z.string().nullable(),
                        is_revert_app: z.boolean(),
                        app_config: z
                            .object({
                                bot_token: z.string().optional(),
                                org_url: z.string().optional(),
                            })
                            .nullable(),
                        environmentId: z.string(),
                        env: z.string(),
                    })
                ),
            })
        ),
    }),
});

export const accountResponseSchema = z.object({
    isDefaultEnvironment: z.boolean().default(true),
    currentPrivateToken: z.string(),
    currentPublicToken: z.string(),
});

export type AccountResponseSchema = z.infer<typeof accountResponseSchema>;

export type AccountSchema = z.infer<typeof accountSchema>;
