import { AppSettings, Button, OnboardingApplicationCards } from '@revertdotdev/components';
import { AccountResponseSchema } from '@revertdotdev/types/schemas/accountSchema';
import { tp_id } from '@revertdotdev/types/schemas/commonSchema';
import { cn } from '@revertdotdev/utils';
import { Dispatch, SetStateAction, useState } from 'react';
import { FrontendSdk } from './FrontendSdk';

type MainProps = {
    step: number;
    account: AccountResponseSchema;
    userId: string;
    setStep: Dispatch<SetStateAction<number>>;
};
function Main({ step, account, userId, setStep }: MainProps) {
    const [selectedApp, setSelectedApp] = useState<tp_id | undefined>();

    const { apps, isDefaultEnvironment, currentPrivateToken, currentPublicToken } = account;

    const app = apps.find((app) => app.tp_id == selectedApp);
    return (
        <main className="2xl:pt-6 sm:pt-3">
            {step == 0 && (
                <OnboardingApplicationCards
                    apps={apps}
                    userId={userId}
                    environment={isDefaultEnvironment ? 'development' : 'production'}
                    setStep={setStep}
                    setSelectedApp={setSelectedApp}
                    selectedApp={selectedApp}
                />
            )}
            {step == 1 && app != undefined && (
                <div>
                    <AppSettings app={app} keys={{ currentPrivateToken, currentPublicToken }} isOnboarding={true} />
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            className={cn({
                                'bg-gray-25/20 text-gray-50/70 cursor-not-allowed hover:bg-gray-25/20': !selectedApp,
                            })}
                            onClick={() => {
                                setStep((step) => step + 1);
                            }}
                        >
                            <span>Integrate SDK</span>
                        </Button>
                    </div>
                </div>
            )}
            {step == 2 && (
                <FrontendSdk userId={userId} environment={isDefaultEnvironment ? 'development' : 'production'} />
            )}
        </main>
    );
}

export default Main;
