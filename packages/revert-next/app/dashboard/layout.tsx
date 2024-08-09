import { Metadata } from 'next';
import { fetchAccountDetails } from '@revertdotdev/lib/api';
import { auth, currentUser } from '@clerk/nextjs/server';
import { SideNav } from '@revertdotdev/components';

export const metadata: Metadata = {
    title: 'Dashboard',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
        return null;
    }

    const account = await fetchAccountDetails(userId);

    if ('message' in account) {
        return null;
    }

    return (
        <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
            <div className="w-full flex-none md:w-64 border border-transparent border-r-gray-25">
                <SideNav value={{ account, userId, user }} />
            </div>
            <div className="flex-grow p-6 md:p-12">{children}</div>
        </div>
    );
}
