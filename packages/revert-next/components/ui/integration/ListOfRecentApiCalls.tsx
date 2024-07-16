'use client';

import { useRecentApiCall } from '@revertdotdev/hooks';
import { Badge, Separator } from '@revertdotdev/components';
import { cn, uuid } from '@revertdotdev/utils';
import { Fragment } from 'react';

export function ListOfRecentApiCalls({ appId }: { appId: string }) {
    const { data } = useRecentApiCall(appId);

    if (!data) {
        return null;
    }

    if (!data.result) {
        return <p className="text-gray-50/70 font-semibold">No Connection</p>;
    }

    if (data && data.result.length < 1) {
        return <p className="text-gray-50/70 font-semibold">No API Calls</p>;
    }

    return (
        <>
            {data.result.map((call) => {
                return (
                    <Fragment key={uuid()}>
                        <div className="flex justify-between items-center">
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
                        <Separator />
                    </Fragment>
                );
            })}
        </>
    );
}
