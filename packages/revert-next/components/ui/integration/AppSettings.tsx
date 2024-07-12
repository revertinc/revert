'use client';

import { Icons, KeyIcon } from '@revertdotdev/icons';
import { Button, Clipboard, Input, Label } from '@revertdotdev/components';
import { AppInfo } from '@revertdotdev/types/schemas/appSchema';
import { useState } from 'react';
import { cn } from '@revertdotdev/utils';

type AppSettingsProps = {
    app: AppInfo;
    keys: {
        currentPublicToken: string;
        currentPrivateToken: string;
    };
};

export function AppSettings({ app, keys }: AppSettingsProps) {
    const { app_client_id, app_client_secret, id, is_revert_app } = app;
    const { currentPrivateToken, currentPublicToken } = keys;

    const [customPreferenceView, setCustomPreferenceView] = useState<boolean>(is_revert_app);

    return (
        <div className="max-w-[64rem]">
            <h3 className="text-lg font-medium mb-2">Choose your preference</h3>
            <div className="flex gap-4 mb-4">
                <button
                    className={cn('border border-gray-25 rounded-xl w-6/12 p-4', {
                        'gradient-border': !customPreferenceView,
                    })}
                    onClick={() => (customPreferenceView ? setCustomPreferenceView(false) : null)}
                >
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
                <button
                    className={cn('border border-gray-25 rounded-xl w-6/12 p-4', {
                        'gradient-border': customPreferenceView,
                    })}
                    onClick={() => (!customPreferenceView ? setCustomPreferenceView(true) : null)}
                >
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
            {customPreferenceView ? (
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
                            defaultValue={app_client_id ?? ''}
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
                            defaultValue={app_client_secret ?? ''}
                        />
                    </div>
                </div>
            ) : (
                <div className="border border-gray-25 rounded-xl p-8 mb-8">
                    <div className="flex flex-col gap-2 mb-4">
                        <Label className="text-slate-50/70 font-medium">AppId</Label>
                        <Clipboard value={id} />
                    </div>
                    <div className="flex flex-col gap-2 mb-4">
                        <Label className="text-slate-50/70 font-medium">Publishable key</Label>
                        <Clipboard value={currentPublicToken} />
                    </div>
                    <div className="flex flex-col gap-2 mb-4">
                        <Label className="text-slate-50/70 font-medium">Secret key</Label>
                        <Clipboard value={currentPrivateToken} />
                    </div>
                </div>
            )}

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
    );
}
