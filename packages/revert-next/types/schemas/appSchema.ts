import { z } from '@revertdotdev/utils';

import { TP_ID } from './commonSchema';

export const appConfigSchema = z
    .object({
        bot_token: z.string().optional(),
        org_url: z.string().optional(),
    })
    .nullable();

const appObjectSchema = z.object({
    id: z.string(),
    tp_id: TP_ID,
    scope: z.array(z.string()),
    app_client_id: z.string().nullable(),
    app_client_secret: z.string().nullable(),
    owner_account_public_token: z.string().nullable(),
    is_revert_app: z.boolean(),
    app_config: appConfigSchema,
    environmentId: z.string(),
    env: z.string(),
    available_scope: z.array(z.string()),
});

export const appSchema = z.array(appObjectSchema);

export type AppSchema = z.infer<typeof appSchema>;

export type AppInfo = z.infer<typeof appObjectSchema>;

export type AppConfig = z.infer<typeof appConfigSchema>;
