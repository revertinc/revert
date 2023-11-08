import { RevertConnectProps } from './types';
import useRevertConnect from './useRevertConnect';

const RevertConnect = (props: RevertConnectProps) => {
    const { loading, error, open } = useRevertConnect({ config: props.config });
    return (
        <>
            <button
                // disabled={loading || Boolean(error)}
                id="revert-connect-button"
                onClick={() => {console.log(loading,"lola",error) 
                open()}}
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
            <button
                disabled={loading || Boolean(error)}
                id="revert-connect-button-slack"
                onClick={() => open('slack')}
                style={{
                    margin: 10,
                    padding: 10,
                    outline: 'none',
                    background: 'rgb(22, 22, 22)',
                    borderColor: 'rgb(22, 22, 22)',
                    borderRadius: 5,
                    cursor: 'pointer',
                    color: '#fff',
                }}
            >
                Connect to Slack
            </button>
        </>
    );
};

export default RevertConnect;