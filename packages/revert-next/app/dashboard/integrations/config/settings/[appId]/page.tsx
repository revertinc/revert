import { auth } from '@clerk/nextjs/server';
import { AppSettings, TabsContent } from '@revertdotdev/components';
import { fetchAccountDetails } from '@revertdotdev/lib/api';

export const revalidate = 0;

export default async function Page({ params }: { params: { appId: string } }) {
    const { appId } = params;
    const { userId } = auth();
    if (!userId) {
        return null;
    }

    const account = await fetchAccountDetails(userId);

    if ('message' in account) {
        return null;
    }

    const { apps, currentPrivateToken, currentPublicToken } = account;
    const app = apps.find((app) => app.id === appId);

    if (!app) {
        return null;
    }

    return (
        <>
            <TabsContent value="settings">
                <AppSettings app={app} keys={{ currentPrivateToken, currentPublicToken }} />
            </TabsContent>
        </>
    );
}
