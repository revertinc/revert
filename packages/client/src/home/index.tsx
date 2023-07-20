import React from 'react';
import Navbar from './navbar';
import ApiKeys from './apiKeys';
import KeyIcon from '@mui/icons-material/Key';
import AppsIcon from '@mui/icons-material/Apps';
import Integrations from './integrations';

const Home = () => {
    const [tabValue, setTabValue] = React.useState(0);
    const [environment, setEnvironment] = React.useState<string>('production');

    const handleChange = (newTabValue: number) => {
        setTabValue(newTabValue);
    };

    const renderTab = (tabValue: number) => {
        if (tabValue === 0) {
            return <Integrations environment={environment} />;
        } else if (tabValue === 1) {
            return <ApiKeys environment={environment} />;
        } else return undefined;
    };

    return (
        <>
            <Navbar environment={environment} setEnvironment={setEnvironment} />
            <div className="flex h-[100%]">
                <div className="w-[20%] flex flex-col items-center pt-[120px] text-[#6e6e6e]">
                    <ul>
                        <li className="p-2 cursor-pointer" onClick={() => handleChange(0)}>
                            <AppsIcon />
                            <span className="p-2">Integrations</span>
                        </li>
                        <li className="p-2 cursor-pointer" onClick={() => handleChange(1)}>
                            <KeyIcon />
                            <span className="p-2">API Keys</span>
                        </li>
                    </ul>
                </div>
                {renderTab(tabValue)}
            </div>
        </>
    );
};

export default Home;
