import { CSSProperties } from 'vue';

export type RevertConfig = {
    revertToken: string;
    tenantId: string;
  };
  
  export type RevertConnectProps = {
    buttonText?: string;
    buttonStyle?: CSSProperties;
    config: RevertConfig;
};