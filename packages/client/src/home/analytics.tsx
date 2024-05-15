import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useUser } from '@clerk/clerk-react';
import { TailSpin } from 'react-loader-spinner';
import { REVERT_BASE_API_URL } from '../constants';
import * as Sentry from '@sentry/react';
import { useEnvironment } from '../hooks';

const Analytics = () => {
    const { environment } = useEnvironment();
    const user = useUser();
    const [metrics, setMetrics] = useState<any>();
    const [isLoading, setLoading] = useState<boolean>(false);

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
        fetch(`${REVERT_BASE_API_URL}/internal/analytics`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                // TODO(@ashutosh): replace with analytics endpoint.
                const data = result.result;
                if (data) {
                    setMetrics({
                        totalConnections: data.totalConnections,
                        recentConnections: data.recentConnections,
                        recentApiCalls: data.recentApiCalls,
                        connectedApps: data.connectedApps,
                    });
                }
                setLoading(false);
            })
            .catch((error) => {
                Sentry.captureException(error);
                console.log('error', error);
                setLoading(false);
            });
    }, [user.user?.id, environment]);

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
                    {metrics ? (
                        <>
                            <div
                                className="flex justify-between flex-wrap items-start gap-2"
                                style={{ padding: '2rem 5rem', width: '80%' }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '2rem 0rem',
                                        width: '30%',
                                        maxHeight: '208px',
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: 30,
                                            border: '1px #3E3E3E solid',
                                            borderRadius: 10,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            height: 204,
                                            justifyContent: 'flex-start',
                                            position: 'relative',
                                            width: '100%',
                                        }}
                                    >
                                        <p>Total connections</p>
                                        <span className="font-bold mt-4 text-lg text-[#94a3b8]">
                                            {metrics.totalConnections || 'No data'}
                                        </span>
                                    </div>
                                </Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '2rem 0rem',
                                        width: '65%',
                                        maxHeight: '208px',
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: 30,
                                            border: '1px #3E3E3E solid',
                                            borderRadius: 10,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            justifyContent: 'flex-start',
                                            position: 'relative',
                                            width: '100%',
                                            height: 204,
                                        }}
                                    >
                                        <p>Recent connections</p>
                                        <ul className="mt-4 w-full text-sm  text-[#94a3b8]">
                                            {metrics.recentConnections
                                                ? metrics.recentConnections.map((connection) => (
                                                      <li className="flex justify-between">
                                                          <span>{connection.id}</span>
                                                          <span>{connection.createdAt}</span>
                                                      </li>
                                                  ))
                                                : 'No data'}
                                        </ul>
                                    </div>
                                </Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '2rem 0rem',
                                        width: '100%',
                                        maxHeight: '208px',
                                        marginTop: 2,
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: 30,
                                            border: '1px #3E3E3E solid',
                                            borderRadius: 10,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            justifyContent: 'flex-start',
                                            position: 'relative',
                                            width: '100%',
                                        }}
                                    >
                                        <p>Recent API calls</p>
                                        <ul className="mt-4 w-full text-sm text-[#94a3b8]">
                                            {metrics.recentApiCalls
                                                ? metrics.recentApiCalls.map((call) => (
                                                      <li className="flex justify-between">
                                                          <span>{call.method}</span>
                                                          <span>{call.path}</span>
                                                          <span>{call.status}</span>
                                                      </li>
                                                  ))
                                                : 'No data'}
                                        </ul>
                                    </div>
                                </Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '2rem 0rem',
                                        width: '100%',
                                        maxHeight: '208px',
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: 30,
                                            border: '1px #3E3E3E solid',
                                            borderRadius: 10,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            justifyContent: 'flex-start',
                                            position: 'relative',
                                            width: '100%',
                                        }}
                                    >
                                        <p>Connected Apps</p>
                                        <ul className="mt-4 w-full text-sm text-[#94a3b8]">
                                            {metrics.connectedApps
                                                ? metrics.connectedApps.map((app) => (
                                                      <li className="flex justify-between m-2" key={app.appName}>
                                                          <img
                                                              width={50}
                                                              className="object-scale-down"
                                                              alt={app.appName}
                                                              src={app.imageSrc}
                                                          />
                                                          <span>{app.appName}</span>
                                                      </li>
                                                  ))
                                                : 'No data'}
                                        </ul>
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
