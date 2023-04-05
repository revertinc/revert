import { useEffect } from 'react';
import useScript from 'react-script-hook';
import { useRevertConnectProps } from './types';

declare global {
    interface Window {
        Revert: any;
    }
}

window.Revert = window.Revert || {};

export default function useRevertConnect(props: useRevertConnectProps) {
    const [loading, error] = useScript({
        src: '../../../js/src/index.js',
        checkForExisting: true,
    });

    useEffect(() => {
        if (!loading && window.Revert && window.Revert.init) {
            window.Revert.init(props.config);
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
