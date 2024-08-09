'use client';

import { appsInfo } from '@revertdotdev/lib/constants';
import { AppSchema } from '@revertdotdev/types/schemas/appSchema';
import { tp_id } from '@revertdotdev/types/schemas/commonSchema';
import { cn, uuid } from '@revertdotdev/utils';
import { Fragment, useState } from 'react';
import { ModalFooter, Button, ModalClose } from '@revertdotdev/components';
import { createApplication } from '@revertdotdev/lib/actions';

export function ApplicationCards({
    apps,
    userId,
    environment,
}: {
    apps: AppSchema;
    userId: string;
    environment: string;
}) {
    const [selectedApp, setSelectedApp] = useState<tp_id | undefined>();
    const appsId = apps.map((app) => app.tp_id);

    async function handleCreation() {
        if (!selectedApp) {
            return;
        }

        await createApplication({
            userId,
            environment,
            tpId: selectedApp,
        });
    }
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[450px] overflow-scroll p-2 hide-scrollbar">
                {Object.keys(appsInfo).map((app) => {
                    const isAppExist = appsId.includes(app as tp_id);
                    const { name, logo } = appsInfo[app] ?? {};
                    return (
                        <Fragment key={uuid()}>
                            <button
                                className={cn(
                                    'border border-gray-25 rounded-lg px-2 pl-1 py-3 revert-focus-outline',
                                    {
                                        'gradient-border-destructive cursor-not-allowed': isAppExist,
                                    },
                                    { 'gradient-border': !isAppExist && selectedApp === app },
                                )}
                                disabled={isAppExist}
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
            <ModalFooter>
                <ModalClose disabled={!selectedApp} tabIndex={-1}>
                    <Button
                        asChild
                        disabled={!selectedApp}
                        tabIndex={!selectedApp ? -1 : 0}
                        type="submit"
                        className={cn(
                            {
                                'bg-gray-25/20 text-gray-50/70 cursor-not-allowed hover:bg-gray-25/20': !selectedApp,
                            },
                            'w-full',
                        )}
                        onClick={handleCreation}
                    >
                        <span>Add Integration</span>
                    </Button>
                </ModalClose>
            </ModalFooter>
        </>
    );
}
