'use client';

import { inter } from '@revertdotdev/fonts';

type DashboardProps = {
    title: string;
    description: string;
};

export function Header({ title, description }: DashboardProps) {
    return (
        <div className="mb-12">
            <h1 className={`${inter.className} mb-4 text-xl md:text-2xl font-bold`}>{title}</h1>
            <p>{description}</p>
        </div>
    );
}