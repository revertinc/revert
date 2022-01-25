import { useEffect } from 'react';
import useScript from 'react-script-hook';

declare global {
    interface Window {
        Revert: any;
    }
}

window.Revert = window.Revert || {};

export default function useRevertConnect() {
    const [loading, error] = useScript({
        src: 'https://cdn.revert.dev/revert.js',
        checkForExisting: true,
    });

    useEffect(() => {
        console.log(loading, error);
        if (!loading && window.Revert && window.Revert.init) {
            window.Revert.init();
        }
    }, [loading]);

    const open = (integrationId?: string) => {
        if (error) {
            throw new Error(`Error loading Revert script: ${error}`);
        }
        if (!window.Revert) {
            console.error('Revert is not present');
            return;
        }
        window.Revert.open(integrationId);
    };

    return { open, error, loading };
}
