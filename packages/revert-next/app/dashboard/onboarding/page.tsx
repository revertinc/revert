import { inter } from '@revertdotdev/fonts';
import Onboarding from './Onboarding';
import { currentUser } from '@clerk/nextjs/server';
import { fetchAccountDetails } from '@revertdotdev/lib/api';

export default async function Page() {
    const user = await currentUser();

    if (!user) {
        return null;
    }

    const account = await fetchAccountDetails(user.id);

    if ('message' in account) {
        return null;
    }

    const userName = user?.firstName ?? user?.username ?? user?.fullName;

    return (
        <div>
            <div className="relative">
                <div className="w-auto h-32 border border-none rounded-lg bg-gradient-to-br from-accent-500 to-shade-800 mb-4">
                    <div className="absolute ml-8 mt-10">
                        <h1 className={`${inter.className} mb-2 text-xl md:text-2xl font-bold`}>
                            Welcome to Revert{userName ? `, ${userName}` : ``}
                        </h1>
                        <p>Complete these following steps to get your integration up and running</p>
                    </div>
                </div>
            </div>
            <Onboarding account={account} userId={user.id} />
        </div>
    );
}
