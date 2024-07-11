'use client';

import { appsInfo } from '@revertdotdev/lib/constants';
import { AppSchema } from '@revertdotdev/types/schemas/appSchema';
import { tp_id } from '@revertdotdev/types/schemas/commonSchema';
import { cn, uuid } from '@revertdotdev/utils';
import Image from 'next/image';
import { useState } from 'react';

export function ApplicationCards({ apps }: { apps: AppSchema }) {
    const [selectedApp, setSelectedApp] = useState<tp_id | undefined>();
    const appsId = apps.map((app) => app.tp_id);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[430px] overflow-scroll">
            {Object.keys(appsInfo).map((app) => {
                const isAppExist = appsId.includes(app as tp_id);
                const { name } = appsInfo[app] ?? {};
                return (
                    <>
                        <button
                            className={cn(
                                'border border-gray-25 rounded-lg px-2 pl-1 py-3',
                                {
                                    'gradient-border-destructive cursor-not-allowed': isAppExist,
                                },
                                { 'gradient-border': !isAppExist && selectedApp === app }
                            )}
                            disabled={isAppExist}
                            key={uuid()}
                            onClick={() => setSelectedApp(app as tp_id)}
                        >
                            <div className="flex justify-start items-center pl-2">
                                <Image src="/Logo.png" alt="slack" height="44" width="44" />
                                <p className="font-semibold pl-4">{name}</p>
                            </div>
                        </button>
                    </>
                );
            })}
        </div>
    );
}
