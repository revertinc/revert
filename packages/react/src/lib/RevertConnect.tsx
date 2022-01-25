import { CSSProperties, ReactNode } from 'react';
import useRevertConnect from './useRevertConnect';

type RevertConnectProps = {
    children?: ReactNode;
    style?: CSSProperties;
};

const RevertConnect = (props: RevertConnectProps) => {
    const { loading, error, open } = useRevertConnect();
    return (
        <button
            disabled={loading || Boolean(error)}
            id="revert-connect-button"
            onClick={() => open()}
            style={{
                padding: 10,
                outline: 'none',
                background: 'rgb(39, 45, 192)',
                border: '1px solid rgb(39, 45, 192)',
                borderRadius: 5,
                cursor: 'pointer',
                color: '#fff',
                ...props.style,
            }}
        >
            {props.children || 'Connect your CRM'}
        </button>
    );
};

export default RevertConnect;
