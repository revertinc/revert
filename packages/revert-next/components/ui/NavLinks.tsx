'use client';

import { AdjustmentsVerticalIcon, SquaresPlusIcon, KeyIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '../icons';
import { cn } from '@revertdotdev/lib/utils';

const links = [
    { name: 'Dashboard', href: '/dashboard', icon: AdjustmentsVerticalIcon },
    {
        name: 'Integrations',
        href: '/dashboard/integrations',
        icon: SquaresPlusIcon,
    },
    { name: 'API Keys', href: '/dashboard/apikeys', icon: KeyIcon },
    { name: 'Webhooks', href: '/dashboard/webhooks', icon: Icons.webhook },
];

export default function NavLinks() {
    const pathname = usePathname();
    return (
        <>
            {links.map((link) => {
                const LinkIcon = link.icon;
                return (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={cn(
                            'flex h-10 grow text-gray-50 items-center justify-center gap-2 rounded-md p-3 text-sm font-medium hover:bg-slate-50 hover:text-black md:flex-none md:justify-start md:p-2 md:px-3',
                            { 'text-slate-50 bg-accent-400': pathname === link.href }
                        )}
                    >
                        <LinkIcon className="w-6" />
                        <p className="hidden md:block">{link.name}</p>
                    </Link>
                );
            })}
        </>
    );
}
