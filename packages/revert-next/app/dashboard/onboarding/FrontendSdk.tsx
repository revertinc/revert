import { Icons } from '@revertdotdev/icons';
import { inter } from '@revertdotdev/fonts';
import { cn } from '@revertdotdev/utils';
import { useState } from 'react';
import Image from 'next/image';

export function FrontendSdk() {
    const [customPreferenceView, setCustomPreferenceView] = useState<boolean>(false);

    return (
        <div>
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className={`${inter.className} mb-2 text-xl font-bold`}>Integrate frontend SDK</h1>
                    <p className="text-gray-50">Your Api Requests are authenticated using Api keys in the header</p>
                </div>
            </div>
            <div className={cn('flex gap-4 mb-4')}>
                <button
                    className={cn('border border-gray-25 rounded-xl w-6/12 p-4 revert-focus-outline', {
                        'gradient-border': !customPreferenceView,
                    })}
                    onClick={() => (customPreferenceView ? setCustomPreferenceView(false) : null)}
                >
                    <div className="flex items-start justify-start gap-3">
                        <Icons.react className="size-6 stroke-1" />
                        <div className="flex flex-col gap-1">
                            <h4 className="text-left text-gray-50/70 text-base font-semibold">React</h4>
                        </div>
                    </div>
                </button>
                <button
                    className={cn('border border-gray-25 rounded-xl w-6/12 p-4 revert-focus-outline', {
                        'gradient-border': customPreferenceView,
                    })}
                    onClick={() => (!customPreferenceView ? setCustomPreferenceView(true) : null)}
                >
                    <div className="flex items-start justify-start gap-3">
                        <Image src="/vuejs-icon.svg" alt="Vuejs" height={24} width={24} />
                        <div className="flex flex-col gap-1">
                            <h4 className="text-left text-gray-50/70 text-base font-bold">Vue.js</h4>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}
