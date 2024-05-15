import React, { useEffect } from 'react';
import Navbar from './navbar';
import ApiKeys from './apiKeys';
import Analytics from './analytics';

import Onboarding from './onboarding';
import Integrations from './integrations';
import { useUser } from '@clerk/clerk-react';
import { REVERT_BASE_API_URL, DEFAULT_ENV } from '../constants';
import * as Sentry from '@sentry/react';
import Sidebar from '../ui/Sidebar';

declare global {
    interface Window {
        Intercom: any;
    }
}

const renderTab = (tabValue: number, handleChange, environment) => {
    if (tabValue === 0) {
        return <Onboarding changeTabs={() => handleChange(1)} />;
    } else if (tabValue === 1) {
        return <Integrations environment={environment} />;
    } else if (tabValue === 2) {
        return <Analytics environment={environment} />;
    } else if (tabValue === 3) {
        return <ApiKeys environment={environment} />;
    } else return undefined;
};
const getInitialEnvironment = () => {
    var selectedOption = localStorage.getItem('revert_environment_selected') || DEFAULT_ENV;

    return selectedOption;
};

const Home = () => {
    const [tabValue, setTabValue] = React.useState(0);
    const [account, setAccount] = React.useState<any>();
    const [environment, setEnvironment] = React.useState<string>(getInitialEnvironment());
    const user = useUser();

    const setSelectedEnvironment = (option) => {
        localStorage.setItem('revert_environment_selected', option);
        setEnvironment(option);
    };
    useEffect(() => {
        if (window.Intercom) {
            window.Intercom('boot', {
                api_base: 'https://api-iam.intercom.io',
                app_id: process.env.REACT_APP_INTERCOM_APP_ID,
                user_id: user.user?.id, //
                name: user.user?.fullName, // Full name
                email: user.user?.emailAddresses[0].emailAddress, // Email address
                created_at: user.user?.createdAt, // Signup date as a Unix timestamp
            });
        }
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');

        const data = JSON.stringify({
            userId: user.user?.id,
        });
        const requestOptions = {
            method: 'POST',
            body: data,
            headers: headers,
        };
        fetch(`${REVERT_BASE_API_URL}/internal/account`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                setAccount(result?.account);
                const environments: string[] = result?.account?.environments?.map((env) => env.env) || [];
                setSelectedEnvironment(environments?.[0] || DEFAULT_ENV);
            })
            .catch((error) => {
                Sentry.captureException(error);
                console.error('error', error);
            });
    }, [user.user?.id]);

    const handleChange = (newTabValue: number) => {
        setTabValue(newTabValue);
        if (window.Intercom) {
            window.Intercom('update');
        }
    };

    return (
        <>
            <Navbar
                workspaceName={account?.workspaceName}
                environment={environment}
                setEnvironment={(env) => {
                    setEnvironment(env);
                }}
                environmentList={account?.environments}
            />
            <div className="flex h-[100%] bg-[#181d28] text-[#fff]">
                <Sidebar values={{ tabValue, handleChange }} />
                {renderTab(tabValue, handleChange, environment)}
            </div>
        </>
    );
};

export default Home;
