'use client';

import { Icons } from '@revertdotdev/icons';
import { useClipboard } from 'use-clipboard-copy';
import React from 'react';

type CopyToClipboardProps = {
    value: string;
    height?: string | number; // Optional height prop to control height
};
export function CopyToClipboard({ value, height = 'auto' }: CopyToClipboardProps) {
    const clipboard = useClipboard({
        copiedTimeout: 600,
    });

    return (
        <div className="w-full max-w-[64rem]">
            <div className="relative">
                <pre
                    ref={clipboard.target}
                    className="col-span-6 bg-gray-50/5 border border-gray-25/5 text-gray-50/80 text-sm rounded-lg p-2.5 overflow-auto"
                    style={{ height }}
                >
                    <code>{value}</code>
                </pre>
                <button
                    className="absolute end-2 top-2 rounded-lg p-2 inline-flex hover:bg-gray-25 items-center justify-center revert-focus-outline"
                    onClick={() => clipboard.copy(value)}
                >
                    {clipboard.copied ? <Icons.success /> : <Icons.copy />}
                </button>
            </div>
        </div>
    );
}
