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
                    revertToken: 'pk_test_ab0017b3-25fe-4acb-bf75-a7511b2a9f44',
                    tenantId: 'testTenantId_closecrm',
                    // onClose: () => {
                    //     console.log('On close working!');
                    // },
                }}
            />
        </div>
    );
}

export default App;
