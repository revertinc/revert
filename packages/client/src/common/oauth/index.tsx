import React, { useEffect, useMemo } from 'react';
import { TailSpin } from 'react-loader-spinner';
import { useParams } from 'react-router-dom';
import { REVERT_BASE_API_URL } from '../../constants';
import * as Sentry from '@sentry/react';

export const OAuthCallback = (props) => {
    const rootParams = useParams();
    const integrationId = useMemo(() => rootParams.integrationId, [rootParams]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [status, setStatus] = React.useState('starting...');

    useEffect(() => {
        const urlSearchParams = new URLSearchParams(window.location.search);
        const params = Object.fromEntries(urlSearchParams.entries());
        if (Object.keys(params).length && integrationId) {
            if (integrationId === 'hubspot' || integrationId === 'pipedrive') {
                console.log('Post crm installation', integrationId, params);
                const { tenantId, revertPublicToken } = JSON.parse(decodeURIComponent(params.state));
                fetch(
                    `${REVERT_BASE_API_URL}/v1/crm/oauth-callback?integrationId=${integrationId}&code=${params.code}&t_id=${tenantId}&x_revert_public_token=${revertPublicToken}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                )
                    .then((d) => d.json())
                    .then((data) => {
                        console.log('OAuth flow succeeded', data);
                        if (data.error) {
                            const errorMessage =
                                data.error?.code === 'P2002'
                                    ? ': Already connected another CRM. Please disconnect first.'
                                    : '';
                            setStatus('Errored out' + errorMessage);
                            window.close();
                        } else {
                            setStatus('Succeeded. Please feel free to close this window.');
                            window.close();
                        }
                        setIsLoading(false);
                    })
                    .catch((err) => {
                        Sentry.captureException(err);
                        setIsLoading(false);
                        console.error(err);
                        setStatus('Errored out');
                        window.close();
                    });
            } else if (integrationId === 'zohocrm') {
                console.log('Post crm installation', integrationId, params);
                const { tenantId, revertPublicToken } = JSON.parse(decodeURIComponent(params.state));
                fetch(
                    `${REVERT_BASE_API_URL}/v1/crm/oauth-callback?integrationId=zohocrm&code=${params.code}&t_id=${tenantId}&x_revert_public_token=${revertPublicToken}&location=${params.location}&accountURL=${params['accounts-server']}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                )
                    .then((d) => d.json())
                    .then((data) => {
                        console.log('OAuth flow succeeded', data);
                        if (data.error) {
                            const errorMessage =
                                data.error?.code === 'P2002'
                                    ? ': Already connected another CRM. Please disconnect first.'
                                    : '';
                            setStatus('Errored out' + errorMessage);
                            window.close();
                        } else {
                            setStatus('Succeeded. Please feel free to close this window.');
                            window.close();
                        }
                        setIsLoading(false);
                    })
                    .catch((err) => {
                        Sentry.captureException(err);
                        setIsLoading(false);
                        console.error(err);
                        setStatus('Errored out');
                        window.close();
                    });
            } else if (integrationId === 'sfdc') {
                console.log('Post crm installation', integrationId, params);
                const { tenantId, revertPublicToken } = JSON.parse(decodeURIComponent(params.state));
                fetch(
                    `${REVERT_BASE_API_URL}/v1/crm/oauth-callback?integrationId=sfdc&code=${params.code}&t_id=${tenantId}&x_revert_public_token=${revertPublicToken}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                )
                    .then((d) => d.json())
                    .then((data) => {
                        console.log('OAuth flow succeeded', data);
                        if (data.error) {
                            const errorMessage =
                                data.error?.code === 'P2002'
                                    ? ': Already connected another CRM. Please disconnect first.'
                                    : '';
                            setStatus('Errored out' + errorMessage);
                            window.close();
                        } else {
                            setStatus('Succeeded. Please feel free to close this window.');
                            window.close();
                        }
                        setIsLoading(false);
                    })
                    .catch((err) => {
                        Sentry.captureException(err);
                        setIsLoading(false);
                        console.error(err);
                        setStatus('Errored out');
                        window.close();
                    });
            } else if (integrationId === 'slack') {
                console.log('Post communication app installation', integrationId, params);
                const { tenantId, revertPublicToken } = JSON.parse(decodeURIComponent(params.state));
                fetch(
                    `${REVERT_BASE_API_URL}/v1/chat/oauth-callback?integrationId=${integrationId}&code=${params.code}&t_id=${tenantId}&x_revert_public_token=${revertPublicToken}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                )
                    .then((d) => {
                        console.log(d);
                        return d.json();
                    })
                    .then((data) => {
                        console.log('OAuth flow succeeded', data);
                        if (data.error) {
                            const errorMessage =
                                data.error?.code === 'P2002'
                                    ? ': Already connected another app. Please disconnect first.'
                                    : '';
                            setStatus('Errored out' + errorMessage);
                        } else {
                            setStatus('Succeeded. Please feel free to close this window.');
                            window.close();
                        }
                        setIsLoading(false);
                    })
                    .catch((err) => {
                        Sentry.captureException(err);
                        setIsLoading(false);
                        console.error(err);
                        setStatus('Errored out');
                    });
            }else if (integrationId === 'discord') {
                console.log('Post communication app installation', integrationId, params);
                const { tenantId, revertPublicToken } = JSON.parse(decodeURIComponent(params.state));
                fetch(
                    `${REVERT_BASE_API_URL}/v1/chat/oauth-callback?integrationId=${integrationId}&code=${params.code}&t_id=${tenantId}&x_revert_public_token=${revertPublicToken}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                )
                    .then((d) => {
                        console.log(d);
                        return d.json();
                    })
                    .then((data) => {
                        console.log('OAuth flow succeeded', data);
                        if (data.error) {
                            const errorMessage =
                                data.error?.code === 'P2002'
                                    ? ': Already connected another app. Please disconnect first.'
                                    : '';
                            setStatus('Errored out' + errorMessage);
                        } else {
                            setStatus('Succeeded. Please feel free to close this window.');
                            window.close();
                        }
                        setIsLoading(false);
                    })
                    .catch((err) => {
                        Sentry.captureException(err);
                        setIsLoading(false);
                        console.error(err);
                        setStatus('Errored out');
                        window.close();
                    });
            }
        }
    }, [integrationId]);

    return (
        <div>
            <h3 className="flex justify-center font-bold">OAuth Authorization {status}</h3>
            {isLoading && (
                <TailSpin
                    wrapperStyle={{ justifyContent: 'center', marginTop: '100px' }}
                    color="#1C1C1C"
                    height={80}
                    width={80}
                />
            )}
        </div>
    );
};
