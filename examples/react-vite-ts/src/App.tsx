import { RevertConnect } from '@revertdotdev/revert-react';

function App() {
    return (
        <div
            style={{
                margin: '2rem',
                display: 'flex',
                justifyContent: 'center',
            }}
        >
            <RevertConnect
                config={{
                    revertToken: 'pk_test_Y2xlcmsuc3Ryb25nLmRlZXItNTYubGNsLmRldiQ',
                    tenantId: 'testTenantId',
                }}
            />
        </div>
    );
}

export default App;
