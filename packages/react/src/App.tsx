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
                    revertToken: 'pk_test_9b6753df-67c8-40f4-b6b7-d0b4e641e736',
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
