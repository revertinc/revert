import { ref, onMounted, onUnmounted, watch } from 'vue';

export const useRevertConnectScript = () => {
  const loading = ref(true);
  const error = ref('');

  onMounted(() => {
      const src = process.env.NODE_ENV === 'development' ? 'src/lib/revert-dev.js' : 'https://cdn.revert.dev/revert.js';
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

export const useRevertConnect = (config:any) => {
    const { loading, error } = useRevertConnectScript();
    const integrationsLoading = ref(true);
  
    const open = (integrationId?: string) => {
        if (error.value) {
          throw new Error(`Error loading Revert script: ${error.value}`);
        }
        if (!window.Revert) {
          console.error('Revert is not present');
          return;
        }
        window.Revert.open(integrationId);
    };
  
      onMounted(() => {
        watch(
          () => loading.value,
          (newValue) => {
            if (!newValue && window.Revert && window.Revert.init) {
              window.Revert.init(config);
              integrationsLoading.value = window.Revert.getIntegrationsLoading;
            }
          }
        );

        const checkIntegrationsLoading = setInterval(() => {
          if (window.Revert) {
              integrationsLoading.value = window.Revert.getIntegrationsLoading;
          }
      }, 1000);

        onUnmounted(() => {
            clearInterval(checkIntegrationsLoading);
        });

        });
  
        return {
          loading, 
          open, 
          error, 
          integrationsLoading
        }
  }