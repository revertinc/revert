import { Header, Separator, Tabs, TabsContent, TabsList, TabsTrigger } from '@revertdotdev/components';
import { Icons } from '@revertdotdev/icons';

export default async function Page() {
    return (
        <main>
            <Header title="Linear" description="Configure and Manage your connected apps here" />
            <Tabs defaultValue="account" className="w-[400px]">
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
                <Separator />
                <TabsContent value="api-reference">Api Reference...........</TabsContent>
                <TabsContent value="settings">Settings..........</TabsContent>
            </Tabs>
        </main>
    );
}
