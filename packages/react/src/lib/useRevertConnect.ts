import { useEffect, useState } from 'react';
import { useRevertConnectProps } from './types';

declare global {
    interface Window {
        Revert: any;
    }
}

// Initialize Revert on the window object if it's available
if (typeof window !== 'undefined') {
    window.Revert = window.Revert || {};
}

declare var __CDN_PATH__: string;

export function useRevertConnectScript() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const src = `${__CDN_PATH__}`;
        const script = document.createElement('script');
        script.src = src;
        script.async = true;

        script.onload = () => {
            setLoading(false);
        };

        script.onerror = () => {
            setError(new Error(`Error loading Revert script: ${src}`));
            setLoading(false);
        };

        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return { loading, error };
}
export default function useRevertConnect(props: useRevertConnectProps) {
    const { loading, error } = useRevertConnectScript();
    const [integrationsLoaded, setIntegrationsLoaded] = useState(false);

    useEffect(() => {
        if (!loading && typeof window !== 'undefined' && window.Revert && window.Revert.init) {
            window.Revert.init({
                ...props.config,
                onLoad: () => {
                    props.config.onLoad && props.config.onLoad();
                    setIntegrationsLoaded(window.Revert.getIntegrationsLoaded);
                },
            });
        }
    }, [loading]);

    const open = (integrationId?: string) => {
        if (error) {
            throw new Error(`Error loading Revert script: ${error}`);
        }
        if (typeof window === 'undefined' || !window.Revert) {
            console.error('Revert is not present');
            return;
        }
        window.Revert.open(integrationId);
    };
    return { open, error, loading: loading || !integrationsLoaded };
}