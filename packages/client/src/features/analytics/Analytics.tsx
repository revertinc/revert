import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useUser } from '@clerk/clerk-react';
import { REVERT_BASE_API_URL } from '../../constants';
import * as Sentry from '@sentry/react';
import { useEnvironment } from '../../context/EnvironmentProvider';
import NoRevertAccess from '../../ui/NoRevertAccess';
import AnalyticContainer from './AnalyticContainer';
import Spinner from '../../ui/Spinner';
import { v4 as uuidv4 } from 'uuid';



const styles = {
    box: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2rem 0rem',
        maxHeight: '80rem',
    },
};

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
                    margin: '0 3rem',
                    marginTop: '8rem',
                }}
                className="text-lg"
            >
                <h1 className="text-3xl font-bold mb-3">Analytics</h1>
                <span>Check how your integrations are performing.</span>
            </Box>
            {isLoading ? (
                <Spinner />
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
                                        ...styles.box,
                                        width: '30%',
                                    }}
                                >
                                    <AnalyticContainer>
                                        <p>Total connections</p>
                                        <span className="font-bold mt-4 text-lg text-[#94a3b8]">
                                            {metrics.totalConnections || 'No data'}
                                        </span>
                                    </AnalyticContainer>
                                </Box>
                                <Box
                                    sx={{
                                        ...styles.box,
                                        width: '65%',
                                    }}
                                >
                                    <AnalyticContainer>
                                        <p>Recent connections</p>
                                        <ul className="mt-4 w-full text-sm text-[#94a3b8]">
                                            {metrics.recentConnections.length ? (
                                                metrics.recentConnections.map((connection) => (
                                                    <li className="flex justify-between" key={uuidv4()}>
                                                        <span>{connection.id}</span>
                                                        <span>{connection.createdAt}</span>
                                                    </li>
                                                ))
                                            ) : (
                                                <li>
                                                    <span className="font-bold mt-4 text-lg text-[#94a3b8]">
                                                        No data
                                                    </span>
                                                </li>
                                            )}
                                        </ul>
                                    </AnalyticContainer>
                                </Box>
                                <Box
                                    sx={{
                                        ...styles.box,
                                        width: '100%',
                                        marginTop: 2,
                                    }}
                                >
                                    <AnalyticContainer>
                                        <p>Recent API calls</p>
                                        <ul className="mt-4 w-full text-sm text-[#94a3b8]">
                                            {metrics.recentApiCalls.length ? (
                                                metrics.recentApiCalls.map((call) => (
                                                    <li className="flex justify-between" key={uuidv4()}>
                                                        <span>{call.method}</span>
                                                        <span>{call.path}</span>
                                                        <span>{call.status}</span>
                                                    </li>
                                                ))
                                            ) : (
                                                <li>
                                                    <span className="font-bold mt-4 text-lg text-[#94a3b8]">
                                                        No data
                                                    </span>
                                                </li>
                                            )}
                                        </ul>
                                    </AnalyticContainer>
                                </Box>
                                <Box
                                    sx={{
                                        ...styles.box,
                                        width: '100%',
                                    }}
                                >
                                    <AnalyticContainer>
                                        <p>Connected Apps</p>
                                        <ul className="mt-4 w-full text-sm text-[#94a3b8]">
                                            {metrics.connectedApps.length ? (
                                                metrics.connectedApps.map((app) => (
                                                    <li className="flex justify-between m-2" key={uuidv4()}>
                                                        <img
                                                            width={50}
                                                            className="object-scale-down"
                                                            alt={app.appName}
                                                            src={app.imageSrc}
                                                        />
                                                        <span>{app.appName}</span>
                                                    </li>
                                                ))
                                            ) : (
                                                <li>
                                                    <span className="font-bold mt-4 text-lg text-[#94a3b8]">
                                                        No data
                                                    </span>
                                                </li>
                                            )}
                                        </ul>
                                    </AnalyticContainer>
                                </Box>
                            </div>
                        </>
                    ) : (
                        <NoRevertAccess>
                            You don't seem to have connected any APIs via Revert. Deploy your first integration to start
                            seeing stats here.
                        </NoRevertAccess>
                    )}
                </>
            )}
        </div>
    );
};

export default Analytics;
