import { DEFAULT_ENV, REVERT_BASE_API_URL } from '@revertdotdev/lib/constants';
import { getCookie } from 'cookies-next';
import useSWR from 'swr';

export function useAnalytics(userId: string) {
    const environment = getCookie('revert_environment_selected') ?? DEFAULT_ENV;

    const { data, error, isLoading } = useSWR(
        `${REVERT_BASE_API_URL}/internal/analytics`,
        async () => {
            const data = await fetch(`${REVERT_BASE_API_URL}/internal/analytics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    environment,
                }),
            });

            const analytics = data.json();
            return analytics;
        },
        { revalidateIfStale: true, revalidateOnFocus: true, refreshInterval: 1000 }
    );

    return {
        data,
        error,
        isLoading,
    };
}
