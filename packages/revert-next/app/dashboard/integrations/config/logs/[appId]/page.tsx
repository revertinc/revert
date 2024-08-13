import { auth } from '@clerk/nextjs/server';
import { TabsContent, ListOfRecentApiCalls } from '@revertdotdev/components';
import { fetchAccountDetails } from '@revertdotdev/lib/api';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Revert | Integrations',
};

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

    const app = account.apps.find((app) => app.id === appId);

    if (!app) {
        return null;
    }

    return (
        <>
            <TabsContent value="logs">
                <div className="max-w-[64rem]">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold mb-1">Recent Api Calls</h2>
                        <p className="text-sm text-gray-50/70">
                            Includes outbound requests made to API Providers to retrieve and send data
                        </p>
                    </div>
                    <div className="grid grid-cols-2 text-xs">
                        <div className="col-span-2">
                            <div className="flex justify-between">
                                <h3 className="uppercase text-gray-50/80 font-bold mb-3">endpoint</h3>
                                <h3 className="uppercase text-gray-50/80 font-bold mb-3">status</h3>
                            </div>
                            <div className="flex flex-col gap-3">
                                <ListOfRecentApiCalls appId={app.id} />
                            </div>
                        </div>
                    </div>
                </div>
            </TabsContent>
        </>
    );
}
