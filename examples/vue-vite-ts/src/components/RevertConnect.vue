<template>
    <button :disabled="loading || Boolean(error)" @click="open()" id="revert-connect-button" :style="buttonStyle">
        {{ buttonText }}
    </button>
</template>

<script lang="ts">
import { defineComponent, CSSProperties } from 'vue';
import { RevertConnectProps } from '@revertdotdev/revert-vue';
import { useRevertConnect } from '@revertdotdev/revert-vue';

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
    setup(props: RevertConnectProps) {
        const { loading, open, error } = useRevertConnect(props.config);

        return {
            loading,
            error,
            open,
        };
    },
});
</script>
