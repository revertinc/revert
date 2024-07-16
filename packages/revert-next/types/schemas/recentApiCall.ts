import { z } from '@revertdotdev/utils';

export const recentApiCallSchema = z
    .object({
        result: z.array(
            z.object({
                method: z.enum(['GET', 'POST', 'PUT']),
                path: z.string(),
                status: z.number(),
            })
        ),
    })
    .required();

export type RecentApiCallSchema = z.infer<typeof recentApiCallSchema>;
