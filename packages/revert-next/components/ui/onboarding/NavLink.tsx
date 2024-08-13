'use client';

import { RocketLaunchIcon } from '@revertdotdev/icons';
import { cn } from '@revertdotdev/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const link = {
    name: 'Get Started',
    href: '/dashboard/onboarding',
};

export function OnboardingNavLink() {
    const pathname = usePathname();
    return (
        <Link
            key={link.name}
            href={link.href}
            className={cn(
                'flex h-10 grow text-gray-50 items-center justify-center gap-2 rounded-md p-3 text-sm font-medium hover:bg-slate-50 hover:text-black md:flex-none md:justify-start md:p-2 md:px-3 w-auto border border-gray-25 revert-focus-outline',
                {
                    'text-slate-50 bg-accent-500 border-none': pathname === link.href,
                }
            )}
        >
            <RocketLaunchIcon className="w-6" />
            <p>{link.name}</p>
        </Link>
    );
}
