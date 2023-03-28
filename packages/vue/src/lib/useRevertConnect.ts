import { ref, onMounted } from 'vue';

export const useRevertConnect = (config:any) => {
    const loading = ref(true);
    const error = ref('');
  
    const loadScript = (url: string) => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = url;
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
    };
  
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
          loadScript('https://cdn.revert.dev/revert.js')
          .then(() => {
          loading.value = false;
          if (window.Revert && window.Revert.init) {
            window.Revert.init(config);
          } else {
            console.error('Revert is not present');
          }
        })
        .catch((e) => {
          error.value = `Error loading Revert script: ${e}`;
        });
        });
  
        return {
          loading, 
          open, 
          error
        }
  }