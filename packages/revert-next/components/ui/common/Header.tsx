'use client';

import { inter } from '@revertdotdev/fonts';

type DashboardProps = {
    title: string;
    description: string;
    children?: React.ReactNode;
};

export function Header({ title, description, children }: DashboardProps) {
    return (
        <div className="2xl:mb-12 sm:mb-8 flex justify-between items-center">
            <div>
                <h1 className={`${inter.className} 2xl:mb-4 sm:mb-2 text-xl md:text-2xl font-bold`}>{title}</h1>
                <p className="2xl:text-base sm:text-sm">{description}</p>
            </div>
            {children}
        </div>
    );
}
