import { CSSProperties } from 'vue';

export type RevertConfig = {
    revertToken: string;
    tenantId: string;
    redirectUrl?:string;
    onLoad?: () => void;
    onClose?: () => void;
    onError?: () => void;
};

export type RevertConnectProps = {
    buttonText?: string;
    buttonStyle?: CSSProperties;
    config: RevertConfig;
};
