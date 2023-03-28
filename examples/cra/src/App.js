import { RevertConnect } from '@revertdotdev/revert-react';
import './App.css';

function App() {
    //This you can get from the Revert team
    const REVERT_TOKEN = 'test';
    //This can be any unique string that identifies the user
    const UNIQUE_TENANT_ID = 'testTenantId';
    return (
        <div className="App">
            <header className="App-header">
                <RevertConnect
                    config={{
                        revertToken: REVERT_TOKEN,
                        tenantId: UNIQUE_TENANT_ID,
                    }}
                />
            </header>
        </div>
    );
}

export default App;
