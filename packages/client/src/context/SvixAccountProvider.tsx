import React, { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useApi } from '../data/hooks';
import { useAccount } from '../context/AccountProvider';
import { useEnvironment } from './EnvironmentProvider';

const SvixAccountContext = createContext<any>({});

interface Props {
    children?: ReactNode;
}

export function SvixAccountProvider({ children }: Props) {
    const [svixAccount, setSvixAccount] = useState<any>();
    const { account, loading: isLoading } = useAccount();
    const { environment } = useEnvironment();
    const { fetch, data, loading } = useApi();
    const [creating, setCreating] = useState<boolean>(false);

    const getSvixAccount = useCallback(async () => {
        if (account?.id && environment) {
            await fetch({
                method: 'GET',
                url: `/internal/account/svix/${account?.id}`,
                params: {
                    environment,
                },
            });
        }
    }, [account?.id, environment, fetch]);

    useEffect(
        function () {
            if (data) {
                if (creating) {
                    setSvixAccount(data);
                    setCreating(false);
                    return;
                }

                if (data.environment.includes(environment)) {
                    if (svixAccount && svixAccount.environment.includes(environment)) {
                        return;
                    }
                    setSvixAccount(data);
                } else {
                    getSvixAccount();
                }
            } else if (!loading && !isLoading) {
                getSvixAccount();
            }
        },
        [creating, data, environment, getSvixAccount, isLoading, loading, svixAccount],
    );

    return (
        <SvixAccountContext.Provider
            value={{
                svixAccount,
                setSvixAccount,
                loading: isLoading && loading,
                environment,
                setCreating,
            }}
        >
            {children}
        </SvixAccountContext.Provider>
    );
}

export function useSvixAccount() {
    const context = useContext(SvixAccountContext);
    if (context === undefined) throw new Error('Context was used out of Provider');

    return context;
}
