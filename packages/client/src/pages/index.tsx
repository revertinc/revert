import React, { useEffect, useMemo } from 'react';
import Navbar from '../ui/Navbar';

import { useUser } from '@clerk/clerk-react';
import Sidebar from '../ui/Sidebar';
import { Outlet } from 'react-router-dom';
import Main from '../layout/Main';

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

    return (
        <>
            <Navbar />
            <Main>
                <Sidebar />
                <Outlet />
            </Main>
        </>
    );
};

export default Home;
