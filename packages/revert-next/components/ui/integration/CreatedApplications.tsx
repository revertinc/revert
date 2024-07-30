'use client';

import { Icons } from '@revertdotdev/icons';
import { appsInfo } from '@revertdotdev/lib/constants';
import { AppSchema } from '@revertdotdev/types/schemas/appSchema';
import { uuid } from '@revertdotdev/utils';
import { useRouter } from 'next/navigation';

//Todo: Change logos inside and make this dynamic
export function CreatedApplications({ apps }: { apps: AppSchema }) {
    const router = useRouter();

    if (apps.length < 1) {
        return (
            <div className="flex flex-col justify-center items-center h-[50vh] w-auto">
                <Icons.noapps className="h-24 w-24 mb-4" />
                <p className="text-sm font-bold text-gray-50/70 mb-2">No Integration Configured</p>
                <p className="text-xs font-normal text-gray-50/30">Create and start your Integration journey here</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {apps.map((app) => {
                const { name, logo } = appsInfo[app.tp_id];
                return (
                    <div
                        className="flex justify-between items-center border border-gray-25 rounded-lg px-2 pl-1 py-3"
                        key={uuid()}
                    >
                        <div className="flex justify-start items-center pl-2">
                            {logo}
                            <p className="font-semibold pl-4">{name}</p>
                        </div>
                        <button
                            className="hover:bg-gray-25/20 p-2 rounded-lg"
                            onClick={() => router.push(`/dashboard/integrations/config/settings/${app.id}`)}
                        >
                            <Icons.cog />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
