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
                    revertToken: 'pk_test_5d60ea45-3a00-4896-99b2-b49f186e6ddc',
                    tenantId: 'testTenantId',
                    onClose: () => {
                        console.log('On close working!');
                    },
                }}
            />
        </div>
    );
}

export default App;
