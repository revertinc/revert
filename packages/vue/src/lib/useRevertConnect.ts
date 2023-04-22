import { ref, onMounted, onUnmounted, watch } from 'vue';
import { RevertConfig } from './types';

declare global {
    interface Window {
        Revert: any;
    }
}

// Initialize Revert on the window object if it's available
if (typeof window !== 'undefined') {
    window.Revert = window.Revert || {};
}

export const useRevertConnectScript = () => {
    const loading = ref(true);
    const error = ref('');

    onMounted(() => {
        const src =
            process.env.NODE_ENV === 'development' ? 'src/lib/revert-dev.js' : 'https://cdn.revert.dev/revert.js';
        const script = document.createElement('script');
        script.src = src;
        script.async = true;

        script.onload = () => {
            loading.value = false;
        };

        script.onerror = () => {
            error.value = `Error loading Revert script: ${src}`;
            loading.value = false;
        };

        document.body.appendChild(script);

        onUnmounted(() => {
            document.body.removeChild(script);
        });
    });

    return { loading, error };
};

export const useRevertConnect = (config: RevertConfig) => {
    const { loading, error } = useRevertConnectScript();

    const open = (integrationId?: string) => {
        if (error.value) {
            throw new Error(`Error loading Revert script: ${error.value}`);
        }
        if (!window.Revert) {
            console.error('Revert is not present');
            return;
        }
        if (window.Revert && !window.Revert.getIntegrationsLoaded) {
            console.error('Revert is not loaded');
            return;
        }
        window.Revert.open(integrationId);
    };

    onMounted(() => {
        watch(
            () => loading.value,
            (newValue) => {
                if (!newValue && window.Revert && window.Revert.init) {
                    window.Revert.init({
                        ...config,
                        onLoad: () => {
                            console.log('integrations loaded');
                            config.onLoad && config.onLoad();
                        },
                    });
                }
            }
        );
    });

    return {
        loading: loading,
        open,
        error,
    };
};
