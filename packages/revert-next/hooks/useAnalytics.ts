import { DEFAULT_ENV, REVERT_BASE_API_URL } from '@revertdotdev/lib/constants';
import { AnalyticsSchema, analyticsSchema } from '@revertdotdev/types/schemas/analyticsSchema';
import { getCookie } from 'cookies-next';
import useSWR from 'swr';
import { ZodError } from '@revertdotdev/utils';

export function useAnalytics(userId: string) {
    const environment = getCookie('revert_environment_selected') ?? DEFAULT_ENV;

    const { data, error, isLoading, mutate, isValidating } = useSWR<AnalyticsSchema>(
        `${REVERT_BASE_API_URL}/internal/analytics`,
        async () => {
            const response = await fetch(`${REVERT_BASE_API_URL}/internal/analytics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    environment,
                }),
            });

            const analytics = await response.json();
            const { data, success, error } = analyticsSchema.safeParse(analytics);

            if (!success) {
                throw new ZodError(error.errors);
            }

            return data;
        },
        { revalidateIfStale: true, revalidateOnFocus: true }
    );

    return {
        data,
        error,
        isLoading,
        mutate,
        isValidating,
    };
}
