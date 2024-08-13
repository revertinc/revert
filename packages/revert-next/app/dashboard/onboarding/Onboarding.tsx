'use client';

import { ReachOutLinks, Steps } from '@revertdotdev/components';
import { useState } from 'react';
import Main from './Main';
import { AccountResponseSchema } from '@revertdotdev/types/schemas/accountSchema';

type OnboardingProps = {
    account: AccountResponseSchema;
    userId: string;
};
function Onboarding({ account, userId }: OnboardingProps) {
    const [step, setStep] = useState(account.isOnboardingCompleted ? 2 : 0);

    return (
        <div className="grid grid-cols-[auto,1fr] gap-4">
            <div className="flex flex-col h-[50vh] justify-around w-60">
                <Steps currentStep={step} setStep={setStep} isOnboardingCompleted={account.isOnboardingCompleted} />
                <ReachOutLinks />
            </div>
            <Main step={step} account={account} userId={userId} setStep={setStep} />
        </div>
    );
}

export default Onboarding;
