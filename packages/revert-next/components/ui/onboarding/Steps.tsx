'use client';

import { Icons } from '@revertdotdev/icons';
import { cn, uuid } from '@revertdotdev/utils';
import { Dispatch, SetStateAction } from 'react';

const links = [
    { name: 'Create an Integration', step: 0 },
    {
        name: 'Setup App Credentials',
        step: 1,
    },
    { name: 'Integrate Frontend SDK', step: 2 },
];

export function Steps({ currentStep, setStep }: { currentStep: number; setStep: Dispatch<SetStateAction<number>> }) {
    return (
        <div className="w-auto">
            {links.map((link) => {
                const isCompleted = currentStep > link.step;
                return (
                    <div
                        key={uuid()}
                        className={cn(
                            'flex h-10 text-gray-50/70 items-center gap-2 rounded-md p-3 text-sm font-medium hover:bg-gray-25/5 hover:text-gray-50',
                        )}
                        onClick={() => setStep(link.step)}
                    >
                        {isCompleted ? (
                            <div className="w-3 h-3 rounded-full bg-green-600 flex justify-center">
                                <Icons.check className="h-[12px] w-[9px] stroke-black stroke-3" />
                            </div>
                        ) : (
                            <div className="w-3 h-3 rounded-full border"></div>
                        )}
                        <p>{link.name}</p>
                    </div>
                );
            })}
        </div>
    );
}
