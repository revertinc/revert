import {
    Badge,
    Button,
    Header,
    Input,
    Label,
    Separator,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@revertdotdev/components';
import { Icons, KeyIcon } from '@revertdotdev/icons';
import { cn } from '@revertdotdev/utils';

export default async function Page() {
    return (
        <main>
            <Header title="Linear" description="Configure and Manage your connected apps here" />
            <Tabs defaultValue="account" className="w-auto">
                <TabsList>
                    <TabsTrigger value="api-reference">
                        <div className="flex gap-2 justify-between items-center">
                            <Icons.codeblock />
                            <span>API Reference</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                        <div className="flex gap-2 justify-between items-center">
                            <Icons.cog />
                            <span>Settings</span>
                        </div>
                    </TabsTrigger>
                </TabsList>
                <Separator className="mb-8" />
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
                <TabsContent value="settings">
                    <div className="max-w-[64rem]">
                        <h3 className="text-lg font-medium mb-2">Choose your preference</h3>
                        <div className="flex gap-4 mb-4">
                            <button className="border border-gray-25 rounded-xl w-6/12 p-4">
                                <div className="flex items-start justify-start gap-3">
                                    <KeyIcon className="size-6 stroke-1" />
                                    <div className="flex flex-col gap-1">
                                        <h4 className="text-left text-gray-50/70 text-base font-semibold">
                                            Use Revert app credentials
                                        </h4>
                                        <p className="text-left text-slate-50/70">
                                            Your API Requests are authenticated using Api keys in the header.
                                        </p>
                                    </div>
                                </div>
                            </button>
                            <button className="border border-gray-25 rounded-xl w-6/12 p-4 gradient-border">
                                <div className="flex items-start justify-start gap-3">
                                    <Icons.codeblock className="size-6 stroke-1" />
                                    <div className="flex flex-col gap-1">
                                        <h4 className="text-left text-gray-50/70 text-base font-bold">
                                            Use your own app credentials
                                        </h4>
                                        <p className="text-left text-slate-50/80">
                                            Your API Requests are authenticated using Api keys in the header.
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                        <div className="border border-gray-25 rounded-xl p-8 mb-8">
                            <div className="flex flex-col gap-2 mb-4">
                                <Label htmlFor="client_id" className="text-slate-50/70 font-medium">
                                    Client ID
                                </Label>
                                <Input
                                    type="text"
                                    id="client_id"
                                    className="focus:bg-transparent"
                                    placeholder="Enter your Client ID"
                                />
                            </div>
                            <div className="flex flex-col gap-2 mb-4">
                                <Label htmlFor="client_secret" className="text-slate-50/70 font-medium">
                                    Client Secret
                                </Label>
                                <Input
                                    type="password"
                                    id="client_secret"
                                    className=""
                                    placeholder="Enter your Client Secret"
                                />
                            </div>
                        </div>

                        <Button disabled className="bg-gray-25/20 text-gray-50/70 hover:bg-gray-25/20 mb-12">
                            <span>Save Changes </span>
                        </Button>

                        <div className="p-5 border border-red-500 rounded-xl flex justify-between items-center bg-red-950/80">
                            <div className="flex flex-col gap-1">
                                <h4 className="text-left text-gray-50/70 text-base font-bold">Delete Integration</h4>
                                <p className="text-left text-slate-50/80">
                                    Your API Requests are authenticated using Api keys in the header.
                                </p>
                            </div>
                            <Button variant="destructive">
                                <div className="flex gap-2 justify-center items-center">
                                    <Icons.trash />
                                    <span>Delete Integration</span>
                                </div>
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </main>
    );
}
