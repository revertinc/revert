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
                    revertToken: 'pk_test_0396de2e-73a7-426c-ac5f-ba019eb1fc6a',
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
