import { Header, Input, Label, Separator, Tabs, TabsContent, TabsList, TabsTrigger } from '@revertdotdev/components';
import { Icons, KeyIcon } from '@revertdotdev/icons';

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
                <TabsContent value="api-reference">Api Reference...........</TabsContent>
                <TabsContent value="settings">
                    <div className="max-w-[64rem]">
                        <h3 className="text-lg font-medium mb-2">Choose your preference</h3>
                        <div className="flex gap-4 mb-8">
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
                        <div className="border border-gray-25 rounded-xl p-8">
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
                                    placeholder="Enter your client secret"
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </main>
    );
}
