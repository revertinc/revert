'use client';

import { changeEnvironmentMode } from '@revertdotdev/lib/actions';
import { Icons } from '@revertdotdev/icons';
import { Switch } from '@revertdotdev/components';
import { useAnalytics } from '@revertdotdev/hooks';
import { useEffect } from 'react';

export function EnvironmentMode({
    isDefaultEnvironment,
    userId,
    prodPrivateToken,
}: {
    isDefaultEnvironment: boolean;
    userId: string;
    prodPrivateToken: string;
}) {
    const { mutate } = useAnalytics(userId);

    useEffect(
        function () {
            localStorage.setItem('privateToken', prodPrivateToken);
        },
        [prodPrivateToken]
    );

    return (
        <>
            <Icons.axe className="w-6 hidden md:block" />
            <label htmlFor="environment">Dev Mode</label>
            <Switch
                id="environment"
                className="md:ml-auto"
                checked={isDefaultEnvironment}
                onClick={async () => {
                    await changeEnvironmentMode();
                    setTimeout(async () => {
                        await mutate();
                    }, 1000);
                }}
            />
        </>
    );
}