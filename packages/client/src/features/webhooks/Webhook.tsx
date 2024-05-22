import React, { useEffect, useState } from 'react';
import MainHeader from '../../layout/MainHeader';
import { Box, Switch } from '@mui/material';
import { useSvixAccount } from '../../context/SvixAccountProvider';
import { useApi } from '../../data/hooks';
import { useAccount } from '../../context/AccountProvider';
import { SVIX_CONSUMER_APP_PORTAL_URI } from '../../constants';
import { useEnvironment } from '../../context/EnvironmentProvider';
import Spinner from '../../ui/Spinner';
import toast from 'react-hot-toast';

function getSvixConsumerPortalUrl(key) {
    return `${SVIX_CONSUMER_APP_PORTAL_URI}${key}`;
}
function Webhook() {
    const { loading, svixAccount, setCreating, setSvixAccount } = useSvixAccount();
    const { environment } = useEnvironment();
    const { account } = useAccount();
    const { fetch, data, loading: isLoading } = useApi();
    const [key, setKey] = useState<any>();

    async function handleCreation() {
        await fetch({
            method: 'POST',
            url: `/internal/account/svix`,
            payload: {
                environment,
                accountId: account?.id,
            },
        });
        setCreating(true);
        toast.success('Webhooks Enabled!', {
            position: 'top-center',
        });
    }
    useEffect(
        function () {
            async function getMagicLink() {
                await fetch({
                    method: 'POST',
                    url: '/internal/account/svix/panel/link',
                    payload: {
                        appId: `${account?.id}_${environment}`,
                    },
                });
            }

            if (data && data.account && svixAccount !== data) {
                setSvixAccount(data);
                setKey(undefined);
                return;
            }

            if (!loading && svixAccount && svixAccount.exist) {
                if (!account || !environment) {
                    return;
                }

                if (key && key.environment === environment) {
                    return;
                }

                if (data) {
                    if (data.key && data.environment.includes(environment)) {
                        setKey({ token: data.key, environment });
                    } else {
                        getMagicLink();
                        setKey(undefined);
                    }
                } else {
                    getMagicLink();
                }
            }
        },
        [account, data, environment, fetch, key, loading, setSvixAccount, svixAccount]
    );

    return (
        <div className="w-[80vw] overflow-auto">
            <MainHeader>
                <Box
                    component="div"
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                    className="text-lg mb-4"
                >
                    <h1 className="text-3xl font-bold mb-3">Webhooks</h1>
                    <span className="text-[#b1b8ba]">
                        {!loading && svixAccount && !svixAccount.exist
                            ? 'Enable webhooks to start building and managing'
                            : 'Build and Manage Webhooks'}
                    </span>
                </Box>
                {!loading && svixAccount && !svixAccount.exist && (
                    <Box>
                        <Switch onClick={() => handleCreation()} size="medium" color="success" />
                    </Box>
                )}
            </MainHeader>
            {!loading && svixAccount && !svixAccount.exist && (
                <div className="flex flex-col justify-center items-center h-[70vh] w-[80vw]">
                    <p>Enable webhooks to start configure </p>
                </div>
            )}
            {(loading || isLoading || !svixAccount) && <Spinner />}
            {!loading && svixAccount && svixAccount.exist && key && key.token && (
                <iframe
                    title="svix"
                    id="iframe-svix"
                    src={getSvixConsumerPortalUrl(key.token)}
                    style={{
                        width: '75vw',
                        height: '78vh',
                        border: 'none',
                        color: '#fff',
                        marginLeft: '3vw',
                        marginTop: '2vh',
                        overflow: 'scroll',
                    }}
                    allow="clipboard-write"
                    loading="lazy"
                />
            )}
        </div>
    );
}

export default Webhook;
