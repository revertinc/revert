'use client';

import { createApplication } from '@revertdotdev/lib/actions';
import { appsInfo } from '@revertdotdev/lib/constants';
import { AppSchema } from '@revertdotdev/types/schemas/appSchema';
import { tp_id } from '@revertdotdev/types/schemas/commonSchema';
import { cn, uuid } from '@revertdotdev/utils';
import { Dispatch, Fragment, SetStateAction } from 'react';
import { inter } from '@revertdotdev/fonts';
import { Button } from '@revertdotdev/components';

export function OnboardingApplicationCards({
    apps,
    userId,
    environment,
    setStep,
    selectedApp,
    setSelectedApp,
}: {
    apps: AppSchema;
    userId: string;
    environment: string;
    setStep: Dispatch<SetStateAction<number>>;
    selectedApp: tp_id | undefined;
    setSelectedApp: Dispatch<SetStateAction<tp_id | undefined>>;
}) {
    const appsId = apps.map((app) => app.tp_id);

    async function handleCreation() {
        if (!selectedApp) {
            return;
        }

        if (!appsId.includes(selectedApp)) {
            await createApplication({
                userId,
                environment,
                tpId: selectedApp,
            });
        }
        setStep((step) => step + 1);
    }

    return (
        <div className="mt-12">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className={`${inter.className} mb-2 text-xl font-bold`}>
                        Let&apos;s ship an integration in under 60 minutes
                    </h1>
                    <p>
                        Add a pre-built UI to your frontend with options to select an integration with zero custom code
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[540px] overflow-scroll p-2 mb-4">
                {Object.keys(appsInfo).map((app) => {
                    const { name, logo } = appsInfo[app] ?? {};
                    return (
                        <Fragment key={uuid()}>
                            <button
                                className={cn('border border-gray-25 rounded-lg px-2 pl-1 py-3 revert-focus-outline', {
                                    'gradient-border': selectedApp === app,
                                })}
                                onClick={() => setSelectedApp(app as tp_id)}
                            >
                                <div className="flex justify-start items-center pl-2">
                                    {logo}
                                    <p className="font-semibold pl-4">{name}</p>
                                </div>
                            </button>
                        </Fragment>
                    );
                })}
            </div>
            <div className="flex items-center justify-end p-2">
                <Button
                    disabled={!selectedApp}
                    tabIndex={!selectedApp ? -1 : 0}
                    type="submit"
                    className={cn(
                        {
                            'bg-gray-25/20 text-gray-50/70 cursor-not-allowed hover:bg-gray-25/20': !selectedApp,
                        },
                        'w-40',
                    )}
                    onClick={handleCreation}
                >
                    <span>Get your Api Keys</span>
                </Button>
            </div>
        </div>
    );
}
