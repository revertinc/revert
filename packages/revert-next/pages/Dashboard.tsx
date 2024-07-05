'use client';

import { Badge } from '@revertdotdev/components/ui/dashboard/bagde';
import CardWrapper from '@revertdotdev/components/ui/dashboard/cards';
import ApiRequestChart from '@revertdotdev/components/ui/dashboard/chart';
import DashboardSkeleton from '@revertdotdev/components/ui/skeleton/dashbaord/DashboardSkeleton';
import { useAnalytics } from '@revertdotdev/hooks/useAnalytics';
import { cn, uuid } from '@revertdotdev/lib/utils';

function Dashboard({ userId }: { userId: string }) {
    const { data, error, isLoading, isValidating } = useAnalytics(userId);

    if (error) {
        return null;
    }

    if (isLoading || isValidating) {
        return <DashboardSkeleton />;
    }

    const recentCalls = data?.result?.recentApiCalls;
    return (
        <>
            <div className="grid gap-6 grid-cols-3 mb-8">
                <CardWrapper value={data?.result} />
            </div>
            <div className="flex justify-between gap-6">
                <ApiRequestChart value={data?.result} />
                <div className="border border-gray-25 rounded-xl p-6 w-5/12">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold mb-1">Recent Api Calls</h2>
                        <p className="text-sm text-gray-50/70">
                            Includes outbound requests made to API Providers to retrieve and send data
                        </p>
                    </div>
                    <div className="grid grid-cols-2 text-xs">
                        <div>
                            <h3 className="uppercase text-gray-50/80 font-bold mb-2">endpoint</h3>
                            <div className="flex flex-col gap-3 items-start justify-center">
                                {recentCalls?.length ? (
                                    recentCalls.map((c) => {
                                        return (
                                            <div className="flex items-center" key={uuid()}>
                                                <Badge variant={c.method}> GET </Badge>
                                                <p className="ml-2 text-gray-50/70">{c.path}</p>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-gray-50/70 font-semibold">No API Calls</p>
                                )}
                            </div>
                        </div>
                        <div className="justify-self-end">
                            <h3 className="uppercase text-gray-50/80 font-bold mb-3">enabled</h3>
                            <div className="flex items-center flex-col gap-6 justify-center">
                                {recentCalls?.length > 0 &&
                                    recentCalls.map((c) => {
                                        return (
                                            <div
                                                className={cn('bg-green-500 w-3 h-3 rounded-full mt-0.5', {
                                                    'bg-red-500': !new String(c.status).startsWith('2'),
                                                })}
                                                key={uuid()}
                                            />
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Dashboard;
