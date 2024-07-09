'use client';

import { Icons } from '@revertdotdev/icons';
import Image from 'next/image';

//Todo: Change logos inside and make this dynamic
export function CreatedApplications() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center border border-gray-25 rounded-lg px-2 pl-1 py-3">
                <div className="flex justify-evenly items-center w-1/12">
                    <Image src="/Logo.png" alt="slack" height="44" width="44" />
                    <p className="font-semibold">Slack</p>
                </div>
                <button className="hover:bg-gray-25/20 p-2 rounded-lg">
                    <Icons.cog />
                </button>
            </div>
            <div className="flex justify-between items-center border border-gray-25 rounded-lg px-2 pl-1 py-3">
                <div className="flex justify-evenly items-center w-1/12">
                    <Image src="/Logo.png" alt="slack" height="44" width="44" />
                    <p className="font-semibold">Slack</p>
                </div>
                <button className="hover:bg-gray-25/20 p-2 rounded-lg">
                    <Icons.cog />
                </button>
            </div>
        </div>
    );
}
