import { currentUser } from '@clerk/nextjs/server';
import DashboardHeader from '@revertdotdev/components/ui/DashboardHeader';
import Dashboard from '@revertdotdev/pages/Dashboard';

export default async function Page() {
    const user = await currentUser();

    if (!user) {
        return null;
    }

    return (
        <main>
            <DashboardHeader title="Dashboard" description="Check how your integrations are performing" />
            <Dashboard userId={user.id} />
        </main>
    );
}
