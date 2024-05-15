import { useEffect, useState } from 'react';
import { DEFAULT_ENV } from '../constants';

export function useEnvironment() {
    const [environment, setEnvironment] = useState<string>(function () {
        return localStorage.getItem('revert_environment_selected') || DEFAULT_ENV;
    });

    useEffect(
        function () {
            localStorage.setItem('revert_environment_selected', environment);
        },
        [environment]
    );

    return { environment, setEnvironment };
}
