import React, { useEffect, useMemo } from 'react';
import Navbar from './navbar';

import { useUser } from '@clerk/clerk-react';
import Sidebar from '../ui/Sidebar';
import { Outlet } from 'react-router-dom';

declare global {
    interface Window {
        Intercom: any;
    }
}

const Home = () => {
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

    // Todo: fix Intercom if breaking

    // if (window.Intercom) {
    //     window.Intercom('update');
    // }
    return (
        <>
            <Navbar />
            <div className="flex h-[100%] bg-[#181d28] text-[#fff]">
                <Sidebar />
                <Outlet />
            </div>
        </>
    );
};

export default Home;
