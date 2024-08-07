import { z } from '@revertdotdev/utils';

export const analyticsSchema = z
    .object({
        result: z
            .object({
                totalConnections: z.number(),
                connectedApps: z.array(
                    z.object({
                        appName: z.string(),
                        imageSrc: z.string(),
                    })
                ),
                recentConnections: z.array(
                    z.object({
                        id: z.string(),
                        createdAt: z.string(),
                    })
                ),
                recentApiCalls: z.array(
                    z.object({
                        method: z.enum(['GET', 'POST', 'PUT']).optional().nullable(),
                        path: z.string(),
                        status: z.number(),
                    })
                ),
                totalApiCalls: z.number().optional(),
                summaryApiCalls: z
                    .array(
                        z.object({
                            date: z.string(),
                            numberOfCalls: z.number(),
                        })
                    )
                    .optional(),
            })
            .required(),
    })
    .required();

export type AnalyticsSchema = z.infer<typeof analyticsSchema>;
