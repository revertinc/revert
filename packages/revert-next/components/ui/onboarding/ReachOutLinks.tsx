import { Icons } from '@revertdotdev/icons';
import Link from 'next/link';
import { uuid } from '@revertdotdev/utils';

const links = [
    {
        content: 'Join our Discord',
        href: 'https://discord.com/invite/q5K5cRhymW',
        icon: Icons.contact,
    },
    {
        content: 'Book a call',
        href: '',
        icon: Icons.calendar,
    },
];

export function ReachOutLinks() {
    return (
        <div className="justify-self-end">
            <p className="uppercase text-xs font-bold text-gray-50/70 mb-2 block">More Resources</p>
            {links.map((link) => {
                return (
                    <Link
                        key={uuid()}
                        href={link.href}
                        target="_blank"
                        className="flex h-10 text-gray-50/70 items-center gap-2 rounded-md p-3 text-sm font-medium hover:bg-gray-25/5 hover:text-gray-50"
                    >
                        <link.icon className="w-6" />
                        <p>{link.content}</p>
                    </Link>
                );
            })}
        </div>
    );
}
