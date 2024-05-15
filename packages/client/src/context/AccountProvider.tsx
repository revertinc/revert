import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import { useUser } from '@clerk/clerk-react';
import { useEnvironment } from '../hooks';
import { DEFAULT_ENV, REVERT_BASE_API_URL } from '../constants';

const AccountContext = createContext<any>({});

interface Props {
    children?: ReactNode;
}

export function AccountProvider({ children }: Props) {
    const [account, setAccount] = useState<any>();
    const { user, isLoaded, isSignedIn } = useUser();
    const { setEnvironment } = useEnvironment();

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');

            const data = JSON.stringify({
                userId: user.id,
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
                    setEnvironment(environments?.[0] || DEFAULT_ENV);
                })
                .catch((error) => {
                    Sentry.captureException(error);
                    console.error('error', error);
                });
        }
    }, [account, isLoaded, isSignedIn, setEnvironment, user?.id]);

    return <AccountContext.Provider value={{ account }}>{children}</AccountContext.Provider>;
}

export function useAccount() {
    const context = useContext(AccountContext);
    if (context === undefined) throw new Error('Context was used out of Provider');

    return context;
}
