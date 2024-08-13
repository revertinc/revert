import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_ENV } from '../constants';

const EnvironmentContext = createContext<any>({});

interface Props {
    children?: ReactNode;
}

export function EnvironmentProvider({ children }: Props) {
    const [environment, setEnvironment] = useState<string>(function () {
        return localStorage.getItem('revert_environment_selected') || DEFAULT_ENV;
    });

    useEffect(
        function () {
            localStorage.setItem('revert_environment_selected', environment);
        },
        [environment],
    );
    return (
        <EnvironmentContext.Provider value={{ environment, setEnvironment }}>{children}</EnvironmentContext.Provider>
    );
}

export function useEnvironment() {
    const context = useContext(EnvironmentContext);
    if (context === undefined) throw new Error('Context was used out of Provider');

    return context;
}
