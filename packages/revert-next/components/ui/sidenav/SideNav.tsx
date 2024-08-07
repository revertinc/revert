import Link from 'next/link';
import { OnboardingNavLink, EnvironmentMode, NavLinks } from '@revertdotdev/components';
import { BookOpenIcon } from '@revertdotdev/icons';
import { UserButton } from '@clerk/nextjs';
import { AccountResponseSchema } from '@revertdotdev/types/schemas/accountSchema';
import { User } from '@clerk/nextjs/dist/types/server';
import Image from 'next/image';

type SideNavProps = {
    value: {
        account: AccountResponseSchema;
        userId: string;
        user: User | null;
    };
};

export function SideNav({ value }: SideNavProps) {
    const { account, user, userId } = value;
    const { isDefaultEnvironment, prodPrivateToken } = account;

    return (
        <div className="flex h-full flex-col px-3 py-4">
            <div className="mb-4 flex items-center justify-start">
                <Image src="/logo-revert.png" alt="Revert Logo" height="48" width="48" />
                <p className="text-gray-50 font-medium text-sm ml-1">{account.workspaceName}</p>
            </div>
            <div className="mb-2 h-14">
                <OnboardingNavLink />
            </div>
            <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
                <p className="uppercase text-xs font-bold text-gray-50/70 mb-2 hidden md:block">Overview</p>
                <NavLinks />
                <div className="hidden h-auto w-full grow rounded-md md:block"></div>
                <Link
                    href="http://docs.revert.dev"
                    target="_blank"
                    className="flex grow text-gray-50 items-center justify-center gap-2 rounded-md p-3 text-sm font-medium hover:bg-slate-50 hover:text-black md:flex-none md:justify-start md:p-2 md:px-3 revert-focus-outline"
                >
                    <BookOpenIcon className="w-6" />
                    <p className="hidden md:block">Developer Docs</p>
                </Link>
                <div className="flex grow text-gray-50 items-center justify-center gap-2 rounded-md p-3 text-sm font-medium md:flex-none md:justify-start md:p-2 md:px-3">
                    <EnvironmentMode
                        isDefaultEnvironment={isDefaultEnvironment}
                        userId={userId}
                        prodPrivateToken={prodPrivateToken}
                    />
                </div>
                <div className="flex items-center pl-2 h-12 revert-focus-outline rounded-lg">
                    <UserButton />
                    <p className="ml-3 hidden md:block">{user?.fullName ?? 'User Name'}</p>
                </div>
            </div>
        </div>
    );
}
