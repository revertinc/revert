'use client';

import { inter } from '@revertdotdev/fonts';

type DashboardProps = {
    title: string;
    children?: React.ReactNode;
};

export function FancyHeader({ title, children }: DashboardProps) {
    return (
        <div className="mb-12 flex justify-between items-center">
            <div>
                <div className="flex justify-start items-center mb-4">
                    {children}
                    <h1 className={`${inter.className} text-xl md:text-2xl font-bold`}>{title}</h1>
                </div>
                <p>Configure and manage your connected apps here</p>
            </div>
        </div>
    );
}
