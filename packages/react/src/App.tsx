import RevertConnect from './lib/RevertConnect';

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
                    revertToken: 'localPublicToken',
                    tenantId: 'testTenantId',
                }}
            />
        </div>
    );
}

export default App;
