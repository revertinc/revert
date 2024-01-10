import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useUser } from '@clerk/clerk-react';
import { TailSpin } from 'react-loader-spinner';
import { toast } from 'react-hot-toast';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { REVERT_BASE_API_URL } from '../constants';
import * as Sentry from '@sentry/react';

const Analytics = ({ environment }) => {
    const user = useUser();
    const [account, setAccount] = useState<any>();
    const [isLoading, setLoading] = useState<boolean>(false);
    const [viewSecret, setViewSecret] = useState<boolean>(false);

    useEffect(() => {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');

        const data = JSON.stringify({
            userId: user.user?.id,
            environment: environment,
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
                console.log('error', error);
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
                <h1 className="text-3xl font-bold mb-3">Analytics</h1>
                <span>Check how your integrations are performing.</span>
            </Box>
            {isLoading ? (
                <div className="mt-10">
                    <TailSpin wrapperStyle={{ justifyContent: 'center' }} color="#1C1C1C" height={80} width={80} />
                </div>
            ) : (
                <>
                    {account ? (
                        <>
                            <div
                                className="flex justify-between flex-wrap items-start gap-4"
                                style={{ padding: '3rem 5rem', width: '80%' }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '2rem 0rem',
                                        maxWidth: '340px',
                                        maxHeight: '208px',
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: 30,
                                            border: '2px #00000029 solid',
                                            borderRadius: 10,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            height: 150,
                                            justifyContent: 'flex-start',
                                            position: 'relative',
                                            minWidth: 250,
                                        }}
                                    >
                                        <p className="font-bold mt-4">Total connections</p>
                                        <span>No data</span>
                                    </div>
                                </Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '2rem 0rem',
                                        maxWidth: '340px',
                                        maxHeight: '208px',
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: 30,
                                            border: '2px #00000029 solid',
                                            borderRadius: 10,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            height: 150,
                                            justifyContent: 'flex-start',
                                            position: 'relative',
                                            minWidth: 250,
                                        }}
                                    >
                                        <p className="font-bold mt-4">Connected Apps</p>
                                        <span>No data</span>
                                    </div>
                                </Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '2rem 0rem',
                                        maxWidth: '340px',
                                        maxHeight: '208px',
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: 30,
                                            border: '2px #00000029 solid',
                                            borderRadius: 10,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            height: 150,
                                            justifyContent: 'flex-start',
                                            position: 'relative',
                                            minWidth: 250,
                                        }}
                                    >
                                        <p className="font-bold mt-4">Recent API calls</p>
                                        <span>No data</span>
                                    </div>
                                </Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '2rem 0rem',
                                        maxWidth: '340px',
                                        maxHeight: '208px',
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: 30,
                                            border: '2px #00000029 solid',
                                            borderRadius: 10,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            height: 150,
                                            justifyContent: 'flex-start',
                                            position: 'relative',
                                            minWidth: 250,
                                        }}
                                    >
                                        <p className="font-bold mt-4">Recent connections</p>
                                        <span>No data</span>
                                    </div>
                                </Box>
                            </div>
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
                                You don't seem to have connected any APIs via Revert. Deploy your first integration to
                                start seeing stats here.
                            </Box>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default Analytics;
