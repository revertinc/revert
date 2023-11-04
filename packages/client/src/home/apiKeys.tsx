import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useUser } from '@clerk/clerk-react';
import { TailSpin } from 'react-loader-spinner';
import { toast } from 'react-hot-toast';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { REVERT_BASE_API_URL } from '../constants';
import * as Sentry from '@sentry/react';

const ApiKeys = ({ environment }) => {
    const user = useUser();
    const [account, setAccount] = useState<any>();
    const [isLoading, setLoading] = useState<boolean>(false);
    const [viewSecret, setViewSecret] = useState<boolean>(false);

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
                setAccount(result?.account?.environments.find((e) => e.env === environment));
                setLoading(false);
            })
            .catch((error) => {
                
                Sentry.captureException(error);
                
                setLoading(false);
            });
    }, [user.user?.id, environment]);

    let secretOverlay = {};
    if (!viewSecret) {
        secretOverlay = {
            textShadow: 'white 0px 0px 6px',
            color: '#00000000',
        };
    }

    return (
        <div className="w-[80%]">
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
                <h1 className="text-3xl font-bold mb-3">API Keys</h1>
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
                                        display: 'flex',
                                    }}
                                >
                                    <div className="flex flex-col flex-1">
                                        <p className="font-bold">Publishable key</p>
                                        <span>
                                            This key should be used in your frontend code, can be safely shared, and
                                            does not need to be kept secret.
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-end',
                                            flex: 2,
                                        }}
                                    >
                                        <p
                                            style={{
                                                background: '#1a1a1a',
                                                textAlign: 'left',
                                                padding: '24px',
                                                color: '#fff',
                                                margin: '20px',
                                                fontSize: 'inherit',
                                                borderRadius: 10,
                                                marginBottom: 0,
                                            }}
                                        >
                                            <div
                                                onClick={() => {
                                                    navigator.clipboard.writeText(account?.public_token);
                                                    toast.success('Copied to clipboard!');
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
                                        <span style={{ fontSize: 12, marginRight: 20 }}>Click above to copy</span>
                                    </div>
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
                                        display: 'flex',
                                    }}
                                >
                                    <div className="flex flex-col flex-1">
                                        <p className="font-bold">Secret key</p>
                                        <span>
                                            These are the secret keys to be used from your backend code. They are
                                            sensitive and should be deleted if leaked.
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-end',
                                            flex: 2,
                                        }}
                                    >
                                        <p
                                            style={{
                                                background: '#1a1a1a',
                                                textAlign: 'left',
                                                padding: '24px',
                                                color: '#fff',
                                                margin: '20px',
                                                fontSize: 'inherit',
                                                borderRadius: 10,
                                                marginBottom: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: 'relative',
                                                }}
                                            >
                                                <pre
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(account?.private_token);
                                                        toast.success('Copied to clipboard!');
                                                    }}
                                                >
                                                    <code
                                                        title="Click to Copy"
                                                        style={{
                                                            display: 'block',
                                                            whiteSpace: 'pre-wrap',
                                                            cursor: 'pointer',
                                                            ...secretOverlay,
                                                        }}
                                                    >
                                                        {account?.private_token}
                                                    </code>
                                                </pre>
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        top: -24,
                                                        right: -20,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {viewSecret ? (
                                                        <VisibilityIcon onClick={() => setViewSecret(false)} />
                                                    ) : (
                                                        <VisibilityOffIcon onClick={() => setViewSecret(true)} />
                                                    )}
                                                </div>
                                            </div>
                                        </p>
                                        <span style={{ fontSize: 12, marginRight: 20 }}>Click above to copy</span>
                                    </div>
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
                                You don't seem to have access to the Revert, please contact us at team@revert.dev.
                            </Box>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default ApiKeys;
