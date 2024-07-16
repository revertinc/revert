'use client';

import { useRecentApiCall } from '@revertdotdev/hooks';
import { Badge } from '@revertdotdev/components';
import { cn, uuid } from '@revertdotdev/utils';

export function ListOfRecentApiCalls({ appId }: { appId: string }) {
    const { data } = useRecentApiCall(appId);

    if (!data) {
        return null;
    }

    if (data.result.length < 1) {
        return <p className="text-gray-50/70 font-semibold">No API Calls</p>;
    }

    return (
        <>
            {data.result.map((call) => {
                return (
                    <div className="flex justify-between items-center" key={uuid()}>
                        <div className="flex items-center">
                            <Badge variant={call.method}> {call.method} </Badge>
                            <p className="ml-2 text-gray-50/70">{call.path}</p>
                        </div>
                        <div
                            className={cn('bg-green-500 w-3 h-3 rounded-full mr-5', {
                                'bg-red-500': !new String(call.status).startsWith('2'),
                            })}
                        ></div>
                    </div>
                );
            })}
        </>
    );
}
