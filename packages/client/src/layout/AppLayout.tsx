import React from 'react';
import Home from '../pages';
import { AccountProvider } from '../context/AccountProvider';
import { EnvironmentProvider } from '../context/EnvironmentProvider';
import { SvixAccountProvider } from '../context/SvixAccountProvider';

function AppLayout() {
    return (
        <EnvironmentProvider>
            <AccountProvider>
                <SvixAccountProvider>
                    <Home />
                </SvixAccountProvider>
            </AccountProvider>
        </EnvironmentProvider>
    );
}

export default AppLayout;
