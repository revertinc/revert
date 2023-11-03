import RevertConnect from './lib/RevertConnect';
import { useRevertConnect } from './lib';
const configObject = {
    revertToken: 'sk_live_b47e45bc-7d45-43f0-8818-12e14bd8f6cc',
    tenantId: 'testTenantId',
    onClose: () => {
        console.log('On close working!');
    },
}
const { loading, error, open } = useRevertConnect({ config: configObject });
function App() {
    return (
        <div
            style={{
                margin: '2rem',
                display: 'flex',
                justifyContent: 'center',
            }}
        >
            {/* <RevertConnect
                config={{
                    revertToken: 'localPublicToken',
                    tenantId: 'testTenantId',
                    onClose: () => {
                        console.log('On close working!');
                    },
                }}
            /> */}

            <button
                disabled={loading || Boolean(error)}
                id="revert-connect-button"
                onClick={() => open('hubspot')}
                style={{
                    padding: 10,
                    outline: 'none',
                    background: 'rgb(39, 45, 192)',
                    border: '1px solid rgb(39, 45, 192)',
                    borderRadius: 5,
                    cursor: 'pointer',
                    color: '#fff',
                    // ...props.style,
                }}
            >
                {'Connect your tool'}
            </button>
        </div>
    );
}

export default App;
