'use client';

import { changeEnvironmentMode } from '@revertdotdev/lib/actions';
import { Icons } from '@revertdotdev/icons';
import { Switch } from '@revertdotdev/components';
import { useAnalytics } from '@revertdotdev/hooks';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

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
    const pathname = usePathname();
    const router = useRouter();
    const isSettings = pathname?.includes('config');

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
                    if (isSettings) {
                        router.push('/dashboard/integrations');
                    }
                    setTimeout(async () => {
                        await mutate();
                    }, 1000);
                }}
            />
        </>
    );
}
