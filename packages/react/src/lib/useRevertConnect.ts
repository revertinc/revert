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
const REVERT_TOKEN_LENGTH = 44;

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
    const { tenantId, revertToken } = props.config;

    useEffect(() => {
        /* Todo: 
            This is temporary solution and requires more to be done, We need a mechanism to fetch as we render (before paint), 
            to know if revertToken and tenantId passed exist and its true.        
        */
        const isValidRevertToken = revertToken.length === REVERT_TOKEN_LENGTH;
        const isValidTenantId = tenantId != 'null' && tenantId != undefined;
        const isConfigPropValid = isValidRevertToken && isValidTenantId;
        if (!loading && typeof window !== 'undefined' && window.Revert && window.Revert.init && isConfigPropValid) {
            window.Revert.init({
                ...props.config,
                onLoad: () => {
                    props.config.onLoad && props.config.onLoad();
                    setIntegrationsLoaded(window.Revert.getIntegrationsLoaded);
                },
            });
        }
    }, [loading, props.config]);

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
