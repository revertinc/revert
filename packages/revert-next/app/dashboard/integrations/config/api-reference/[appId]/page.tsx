import { auth } from '@clerk/nextjs/server';
import { Badge, TabsContent } from '@revertdotdev/components';
import { fetchAccountDetails } from '@revertdotdev/lib/api';
import { cn } from '@revertdotdev/utils';

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

    return (
        <>
            <TabsContent value="api-reference">
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
                                <h3 className="uppercase text-gray-50/80 font-bold mb-3">enabled</h3>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <Badge variant="GET"> GET </Badge>
                                        <p className="ml-2 text-gray-50/70">/crm/deals</p>
                                    </div>
                                    <div
                                        className={cn('bg-green-500 w-3 h-3 rounded-full mr-5', {
                                            'bg-red-500': !new String(200).startsWith('2'),
                                        })}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </TabsContent>
        </>
    );
}
