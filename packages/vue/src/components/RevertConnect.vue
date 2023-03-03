<template>
  <button :disabled="loading || Boolean(error)" @click="open()" id="revert-connect-button" :style="buttonStyle">
    {{ buttonText }}
  </button>
</template>

<script lang="ts">
import { defineComponent, ref, CSSProperties } from 'vue';

declare global {
  interface Window {
    Revert: any;
  }
}

window.Revert = window.Revert || {};

interface RevertConfig {
  revertToken: string;
  tenantId: string;
}

export default defineComponent({
  name: 'RevertConnect',
  props: {
    config: {
      type: Object as () => RevertConfig,
      required: true,
    },
    buttonText: {
      type: String,
      default: 'Connect your CRM',
    },
    buttonStyle: {
      type: Object as () => CSSProperties,
      default: () => ({
        padding: '10px',
        outline: 'none',
        background: 'rgb(39, 45, 192)',
        border: '1px solid rgb(39, 45, 192)',
        borderRadius: '5px',
        cursor: 'pointer',
        color: '#fff',
      }),
    },
  },
  setup(props) {
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

    loadScript('https://cdn.revert.dev/revert.js')
      .then(() => {
        loading.value = false;
        if (window.Revert && window.Revert.init) {
          window.Revert.init(props.config);
        } else {
          console.error('Revert is not present');
        }
      })
      .catch((e) => {
        error.value = `Error loading Revert script: ${e}`;
      });

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

    return {
      loading,
      error,
      open,
    };
  },
});
</script>

<style scoped>
/* Styles for the component go here */
</style>
