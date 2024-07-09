'use client';

import { inter } from '@revertdotdev/fonts';

type DashboardProps = {
    title: string;
    description: string;
    children?: React.ReactNode;
};

export function Header({ title, description, children }: DashboardProps) {
    return (
        <div className="mb-12 flex justify-between items-center">
            <div>
                <h1 className={`${inter.className} mb-4 text-xl md:text-2xl font-bold`}>{title}</h1>
                <p>{description}</p>
            </div>
            {children}
        </div>
    );
}
