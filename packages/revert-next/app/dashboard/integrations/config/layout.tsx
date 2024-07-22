'use client';

import { ReactNode } from 'react';
import { FancyHeader, Separator, Tabs, TabsList, TabsTrigger } from '@revertdotdev/components';
import { Icons } from '@revertdotdev/icons';
import { usePathname, useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { cn } from '@revertdotdev/utils';
import { appsInfo } from '@revertdotdev/lib/constants';

interface ConfigLayoutProps {
    children: ReactNode;
}

const ConfigLayout = ({ children }: ConfigLayoutProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const appId = params?.appId as string;
    const isSettings = pathname?.includes('settings');
    const appTpId = appId.split('_');
    const { name, logo } = appsInfo[appTpId.length > 4 ? 'ms_dynamics_365_sales' : appTpId[0]];
    return (
        <div>
            <FancyHeader title={name}>
                <div className="pr-2"> {logo}</div>
            </FancyHeader>
            <Tabs defaultValue="settings" className="w-auto" value={isSettings ? 'settings' : 'api-reference'}>
                <TabsList>
                    <TabsTrigger value="settings">
                        <div
                            className={cn('flex gap-2 justify-between items-center py-2', { 'border-b-2': isSettings })}
                            onClick={() => router.push(`/dashboard/integrations/config/settings/${appId}`)}
                        >
                            <Icons.cog />
                            <span>Settings</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="api-reference">
                        <div
                            className={cn('flex gap-2 justify-between items-center py-2', {
                                'border-b-2': !isSettings,
                            })}
                            onClick={() => router.push(`/dashboard/integrations/config/api-reference/${appId}`)}
                        >
                            <Icons.codeblock />
                            <span>API Reference</span>
                        </div>
                    </TabsTrigger>
                </TabsList>
                <Separator className="mb-8" />
                {children}
            </Tabs>
        </div>
    );
};

export default ConfigLayout;
