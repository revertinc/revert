import React, { useEffect, useMemo } from 'react';
import Navbar from './navbar';
import ApiKeys from './apiKeys';
import Analytics from './analytics';

import Onboarding from './onboarding';
import Integrations from './integrations';
import { useUser } from '@clerk/clerk-react';
import Sidebar from '../ui/Sidebar';

declare global {
    interface Window {
        Intercom: any;
    }
}

const renderTab = (tabValue: number, handleChange) => {
    if (tabValue === 0) {
        return <Onboarding changeTabs={() => handleChange(1)} />;
    } else if (tabValue === 1) {
        return <Integrations />;
    } else if (tabValue === 2) {
        return <Analytics />;
    } else if (tabValue === 3) {
        return <ApiKeys />;
    } else return undefined;
};

const Home = () => {
    const [tabValue, setTabValue] = React.useState(0);
    const { user } = useUser();

    const IntercomParams = useMemo(
        function () {
            return {
                api_base: 'https://api-iam.intercom.io',
                app_id: process.env.REACT_APP_INTERCOM_APP_ID,
                user_id: user?.id, //
                name: user?.fullName, // Full name
                email: user?.emailAddresses[0].emailAddress, // Email address
                created_at: user?.createdAt, // Signup date as a Unix timestamp
            };
        },
        [user]
    );

    useEffect(() => {
        if (window.Intercom) {
            window.Intercom('boot', IntercomParams);
        }
    }, [IntercomParams]);

    const handleChange = (newTabValue: number) => {
        setTabValue(newTabValue);
        if (window.Intercom) {
            window.Intercom('update');
        }
    };

    return (
        <>
            <Navbar />
            <div className="flex h-[100%] bg-[#181d28] text-[#fff]">
                <Sidebar values={{ tabValue, handleChange }} />
                {renderTab(tabValue, handleChange)}
            </div>
        </>
    );
};

export default Home;
