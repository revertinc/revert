import { RevertConnect, useRevertConnect } from '@revertdotdev/revert-react';
import './App.css';

function App() {
    //This you can get from the Revert team
    const REVERT_TOKEN = 'pk_test_Y2xlcmsuc3Ryb25nLmRlZXItNTYubGNsLmRldiQ';
    //This can be any unique string that identifies the user
    const UNIQUE_TENANT_ID = 'testTenantId';
    const { loading, error, open } = useRevertConnect({
        config: {
            revertToken: REVERT_TOKEN,
            tenantId: UNIQUE_TENANT_ID,
        },
    });
    return (
        <div className="App">
            <header className="App-header">
                <RevertConnect
                    style={{
                        background: 'rgb(22, 22, 22)',
                        borderColor: 'rgb(22, 22, 22)',
                    }}
                    config={{
                        revertToken: REVERT_TOKEN,
                        tenantId: UNIQUE_TENANT_ID,
                    }}
                />
                <button
                    disabled={loading || Boolean(error)}
                    id="revert-connect-button2"
                    onClick={() => open('hubspot')}
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
                    Connect to Hubspot
                </button>
            </header>
        </div>
    );
}

export default App;
