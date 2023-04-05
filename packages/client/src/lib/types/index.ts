import { CSSProperties, ReactNode } from 'react';

type RevertConfig = {
    revertToken: string;
    tenantId: string;
};

export type RevertConnectProps = {
    children?: ReactNode;
    style?: CSSProperties;
    config: RevertConfig;
};

export type useRevertConnectProps = {
    config: RevertConfig;
};
