'use client';

import { DashboardSkeleton } from '@revertdotdev/components/skeleton';
import { ApiRequestChart, Badge, CardWrapper } from '@revertdotdev/components';
import { useAnalytics } from '@revertdotdev/hooks';
import { cn, uuid } from '@revertdotdev/utils';

function Dashboard({ userId }: { userId: string }) {
    const { data, error, isLoading, isValidating } = useAnalytics(userId);

    if (isLoading || isValidating) {
        return <DashboardSkeleton />;
    }

    if (error || !data) {
        return null;
    }

    const recentCalls = data?.result?.recentApiCalls;
    return (
        <>
            <div className="grid gap-6 grid-cols-3 mb-8">
                <CardWrapper value={data} />
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
                        <div className="col-span-2">
                            <div className="flex justify-between">
                                <h3 className="uppercase text-gray-50/80 font-bold mb-3">endpoint</h3>
                                <h3 className="uppercase text-gray-50/80 font-bold mb-3">enabled</h3>
                            </div>
                            <div className="flex flex-col gap-3">
                                {recentCalls?.length ? (
                                    recentCalls.map((c) => {
                                        return (
                                            <div key={uuid()} className="flex justify-between items-center">
                                                <div className="flex items-center">
                                                    <Badge variant={c.method}> {c.method} </Badge>
                                                    <p className="ml-2 text-gray-50/70">{c.path}</p>
                                                </div>
                                                <div
                                                    className={cn('bg-green-500 w-3 h-3 rounded-full mr-5', {
                                                        'bg-red-500': !new String(c.status).startsWith('2'),
                                                    })}
                                                    key={uuid()}
                                                ></div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-gray-50/70 font-semibold">No API Calls</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Dashboard;
