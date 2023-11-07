import React, { useEffect } from 'react';
import Navbar from './navbar';
import ApiKeys from './apiKeys';
import KeyIcon from '@mui/icons-material/Key';
import AppsIcon from '@mui/icons-material/Apps';
import Integrations from './integrations';
import { useUser } from '@clerk/clerk-react';
import { REVERT_BASE_API_URL, DEFAULT_ENV } from '../constants';
import * as Sentry from '@sentry/react';

const selectedStyle = {
    background: '#f4f4f4',
    borderRadius: 4,
};

const Home = () => {
    const [tabValue, setTabValue] = React.useState(0);
    const [account, setAccount] = React.useState<any>();
    const [environment, setEnvironment] = React.useState<string>(DEFAULT_ENV);
    const user = useUser();

    useEffect(() => {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');

        const data = JSON.stringify({
            userId: user.user?.id,
        });
        const requestOptions = {
            method: 'POST',
            body: data,
            headers: headers,
        };
        fetch(`${REVERT_BASE_API_URL}/internal/account`, requestOptions)
            .then((response) => {
            return response.json()
            })
            .then((result) => {
                setAccount(result?.account);
                const environments: string[] = result?.account?.environments?.map((env) => env.env) || [];
                if (!environments.includes(DEFAULT_ENV)) {
                    setEnvironment(environments?.[0]);
                }
            })
            .catch((error) => {
                Sentry.captureException(error);
                console.log('error', error);
            });
    }, [user.user?.id]);

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
            <Navbar
                workspaceName={account?.workspaceName}
                environment={environment}
                setEnvironment={setEnvironment}
                environmentList={account?.environments}
            />
            <div className="flex h-[100%]">
                <div className="w-[20%] flex flex-col items-center pt-[120px] text-[#6e6e6e]">
                    <ul>
                        <li
                            className="p-2 cursor-pointer"
                            style={tabValue === 0 ? selectedStyle : undefined}
                            onClick={() => handleChange(0)}
                        >
                            <AppsIcon />
                            <span className="p-2">Integrations</span>
                        </li>
                        <li
                            className="p-2 cursor-pointer"
                            style={tabValue === 1 ? selectedStyle : undefined}
                            onClick={() => handleChange(1)}
                        >
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
