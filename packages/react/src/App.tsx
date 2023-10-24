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
                    revertToken: 'pk_test_55de9cf2-03a7-45cf-87fe-adb60c792308',
                    tenantId: 'testTenantId_closecrm',
                    onClose: () => {
                        console.log('On close working!');
                    },
                }}
            />
        </div>
    );
}

export default App;
