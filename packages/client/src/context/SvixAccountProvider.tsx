import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useApi } from '../data/hooks';
import { useAccount } from '../context/AccountProvider';
import { useEnvironment } from './EnvironmentProvider';

const SvixAccountContext = createContext<any>({});

interface Props {
    children?: ReactNode;
}

export function SvixAccountProvider({ children }: Props) {
    const [svixAccount, setSvixAccount] = useState<any>();
    const { account } = useAccount();
    const { environment } = useEnvironment();
    const [isExist, setIsExist] = useState();
    const { fetch, data, status, loading } = useApi();

    async function handleCreation() {
        await fetch({
            method: 'POST',
            url: `/internal/account/svix`,
            payload: {
                environment,
                accountId: account?.id,
            },
        });
    }

    useEffect(
        function () {
            async function getSvixAccount() {
                await fetch({
                    method: 'GET',
                    url: `/internal/account/svix/${account.id}`,
                    params: {
                        environment,
                    },
                });
            }

            if (svixAccount) {
                return;
            }

            if (data && !svixAccount && account) {
                setIsExist(data.exist);
                if (data.exist) setSvixAccount(data.account);
                return;
            }

            if (status) {
                return;
            }

            if (!data && account) {
                getSvixAccount();
            }
        },
        [account, data, environment, fetch, status, svixAccount]
    );

    return (
        <SvixAccountContext.Provider value={{ svixAccount, setSvixAccount, loading, isExist, handleCreation }}>
            {children}
        </SvixAccountContext.Provider>
    );
}

export function useSvixAccount() {
    const context = useContext(SvixAccountContext);
    if (context === undefined) throw new Error('Context was used out of Provider');

    return context;
}
