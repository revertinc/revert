import React, { useEffect, useState } from 'react';
import Navbar from './navbar';
import Box from '@mui/material/Box';
import { useUser } from '@clerk/clerk-react';
import { REVERT_BASE_API_URL } from '../constants';
import { TailSpin } from 'react-loader-spinner';

const Home = () => {
    const user = useUser();
    const [account, setAccount] = useState<any>();
    const [isLoading, setLoading] = useState<boolean>(false);

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
        setLoading(true);
        fetch(`${REVERT_BASE_API_URL}/internal/account`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                setAccount(result?.account);
                setLoading(false);
            })
            .catch((error) => {
                console.log('error', error);
                setLoading(false);
            });
    }, [user.user?.id]);

    return (
        <>
            <Navbar />
            <Box
                component="div"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0 5rem',
                    paddingTop: '120px',
                }}
                className="text-lg"
            >
                <h1 className="text-3xl font-bold">API Keys</h1>
                <span>Manage your Revert API keys here.</span>
            </Box>
            {isLoading ? (
                <div className="mt-10">
                    <TailSpin wrapperStyle={{ justifyContent: 'center' }} color="#1C1C1C" height={80} width={80} />
                </div>
            ) : (
                <>
                    {account ? (
                        <>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '5rem 5rem',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 30,
                                        border: '2px #00000029 solid',
                                        borderRadius: 10,
                                        maxWidth: '60%',
                                    }}
                                >
                                    <p className="font-bold">Publishable key</p>
                                    <span>
                                        This key should be used in your frontend code, can be safely shared, and does
                                        not need to be kept secret.
                                    </span>
                                </div>
                                <div>
                                    <p
                                        style={{
                                            background: '#1a1a1a',
                                            textAlign: 'left',
                                            padding: '20px',
                                            color: '#fff',
                                            margin: '20px',
                                            fontSize: 'inherit',
                                            borderRadius: 10,
                                        }}
                                    >
                                        <div
                                            onClick={() => {
                                                navigator.clipboard.writeText(account?.public_token);
                                            }}
                                        >
                                            <pre>
                                                <code
                                                    title="Click to Copy"
                                                    style={{
                                                        display: 'block',
                                                        whiteSpace: 'pre-wrap',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {account?.public_token}
                                                </code>
                                            </pre>
                                        </div>
                                    </p>
                                </div>
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0 5rem',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 30,
                                        border: '2px #00000029 solid',
                                        borderRadius: 10,
                                        maxWidth: '60%',
                                    }}
                                >
                                    <p className="font-bold">Secret key</p>
                                    <span>
                                        These are the secret keys to be used from your backend code. They are sensitive
                                        and should be deleted if leaked.
                                    </span>
                                </div>
                                <div>
                                    <p
                                        style={{
                                            background: '#1a1a1a',
                                            textAlign: 'left',
                                            padding: '20px',
                                            color: '#fff',
                                            margin: '20px',
                                            fontSize: 'inherit',
                                            borderRadius: 10,
                                        }}
                                    >
                                        <div
                                            onClick={() => {
                                                navigator.clipboard.writeText(account?.private_token);
                                            }}
                                        >
                                            <pre>
                                                <code
                                                    title="Click to Copy"
                                                    style={{
                                                        display: 'block',
                                                        whiteSpace: 'pre-wrap',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {account?.private_token}
                                                </code>
                                            </pre>
                                        </div>
                                    </p>
                                </div>
                            </Box>
                        </>
                    ) : (
                        <>
                            <Box
                                component="div"
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '0 5rem',
                                    paddingTop: '120px',
                                }}
                                className="text-lg"
                            >
                                You don't seem to have access to the product, please contact us at team@revert.dev.
                            </Box>
                        </>
                    )}
                </>
            )}
        </>
    );
};

export default Home;
