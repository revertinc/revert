import React from 'react';
import Home from '../home/';
import Navbar from '../ui/Navbar';
import Main from '../ui/Main';
import Side from '../ui/Side';
import { AccountProvider } from '../context/AccountProvider';
import { EnvironmentProvider } from '../context/EnvironmentProvider';

function AppLayout() {
    return (
        // <div>
        //     <Navbar />
        //     <Side />
        //     <Main />
        // </div>
        <EnvironmentProvider>
            <AccountProvider>
                <Home />
            </AccountProvider>
        </EnvironmentProvider>
    );
}

export default AppLayout;
