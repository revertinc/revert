'use client';

import { Icons, KeyIcon } from '@revertdotdev/icons';
import { Button, Clipboard, FancyInputBox, Input, Label } from '@revertdotdev/components';
import { AppInfo } from '@revertdotdev/types/schemas/appSchema';
import { useState } from 'react';
import { cn } from '@revertdotdev/utils';
import { deleteIntegration, updateCredentials } from '@revertdotdev/lib/actions';
import { useRouter } from 'next/navigation';

type AppSettingsProps = {
    app: AppInfo;
    keys: {
        currentPublicToken: string;
        currentPrivateToken: string;
    };
};

export function AppSettings({ app, keys }: AppSettingsProps) {
    const { app_client_id, app_client_secret, id, is_revert_app, scope, tp_id } = app;
    const { currentPrivateToken, currentPublicToken } = keys;
    const currentClientSecret = app_client_secret ?? '';
    const currentClientId = app_client_id ?? '';

    const [customPreferenceView, setCustomPreferenceView] = useState<boolean>(is_revert_app);
    const [clientId, setClientId] = useState<string>(currentClientId);
    const [clientSecret, setClientSecret] = useState<string>(currentClientSecret);
    const router = useRouter();

    const isValueChange = clientId !== currentClientId || clientSecret !== currentClientSecret;

    async function handleDeleteIntegration() {
        const privateToken = localStorage.getItem('privateToken');

        if (!privateToken) {
            // handle this error
            return;
        }

        await deleteIntegration({
            appId: id,
            privateToken,
        });
        router.push('/dashboard/integrations');
    }

    async function handleSaveChanges() {
        //Todo: handle save changes with server actions;
        const privateToken = localStorage.getItem('privateToken');

        if (!privateToken) {
            // handle this error
            return;
        }
        if (customPreferenceView) {
            await updateCredentials({
                appId: app.id,
                clientId,
                clientSecret,
                scopes: scope,
                tpId: tp_id,
                isRevertApp: true,
                privateToken,
            });
        } else {
            await updateCredentials({
                appId: app.id,
                clientId: currentClientId,
                clientSecret: currentClientSecret,
                scopes: scope,
                tpId: tp_id,
                isRevertApp: false,
                privateToken,
            });
        }
    }

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
                            onChange={(e) => setClientId(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2 mb-4">
                        <Label htmlFor="client_secret" className="text-slate-50/70 font-medium">
                            Client Secret
                        </Label>
                        <Input
                            type="password"
                            id="client_secret"
                            placeholder="Enter your Client Secret"
                            defaultValue={app_client_secret ?? ''}
                            onChange={(e) => setClientSecret(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2 mb-4">
                        <Label htmlFor="scopes" className="text-slate-50/70 font-medium">
                            Scopes
                        </Label>
                        <FancyInputBox />
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

            <Button
                disabled
                className={cn('mb-12', {
                    'bg-gray-25/20 text-gray-50/70 hover:bg-gray-25/20 cursor-not-allowed':
                        (is_revert_app && !isValueChange && customPreferenceView) ||
                        (!customPreferenceView && !is_revert_app),
                })}
                onClick={handleSaveChanges}
            >
                <span>Save Changes</span>
            </Button>

            <div className="p-5 border border-red-500 rounded-xl flex justify-between items-center bg-red-950/80">
                <div className="flex flex-col gap-1">
                    <h4 className="text-left text-gray-50/70 text-base font-bold">Delete Integration</h4>
                    <p className="text-left text-slate-50/80">
                        Your API Requests are authenticated using Api keys in the header.
                    </p>
                </div>
                <Button variant="destructive" onClick={handleDeleteIntegration}>
                    <div className="flex gap-2 justify-center items-center">
                        <Icons.trash />
                        <span>Delete Integration</span>
                    </div>
                </Button>
            </div>
        </div>
    );
}
