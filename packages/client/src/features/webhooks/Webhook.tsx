import React, { useEffect, useState } from 'react';
import MainHeader from '../../layout/MainHeader';
import { Box } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useSvixAccount } from '../../context/SvixAccountProvider';
import { TailSpin } from 'react-loader-spinner';
import { useApi } from '../../data/hooks';
import { useAccount } from '../../context/AccountProvider';
import { SVIX_CONSUMER_APP_PORTAL_URI } from '../../constants';
import { useEnvironment } from '../../context/EnvironmentProvider';

function getSvixConsumerPortalUrl(key) {
    return `${SVIX_CONSUMER_APP_PORTAL_URI}${key}`;
}
function Webhook() {
    const { loading, handleCreation, svixAccount } = useSvixAccount();
    const { environment } = useEnvironment();
    const { account } = useAccount();
    const { fetch, data } = useApi();
    const [key, setKey] = useState<any>();
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

            if (!loading && svixAccount && svixAccount.exist) {
                if (!account || !environment) {
                    return;
                }
                if (key && key.environment === environment) {
                    return;
                }
                if (data) {
                    if (data.environment.includes(environment)) {
                        setKey({ token: data.key, environment });
                    } else {
                        getMagicLink();
                    }
                } else {
                    getMagicLink();
                }
            }
        },
        [account, data, environment, fetch, key, loading, svixAccount]
    );

    return (
        <div className="w-[80vw]">
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
                        <LoadingButton
                            variant="text"
                            style={{
                                background: '#293347',
                                color: '#fff',
                                padding: '0.6rem 1.4rem',
                                textTransform: 'capitalize',
                            }}
                            onClick={() => handleCreation()}
                        >
                            Webhook
                        </LoadingButton>
                    </Box>
                )}
            </MainHeader>
            {!loading && svixAccount && !svixAccount.exist && (
                <div className="flex flex-col justify-center items-center h-[70vh] w-[80vw]">
                    <p>Enable webhooks to start configure </p>
                </div>
            )}
            {loading && (
                <TailSpin
                    wrapperStyle={{ justifyContent: 'center', marginTop: '28vh' }}
                    color="#1C1C1C"
                    height={80}
                    width={80}
                />
            )}
            {!loading && svixAccount && svixAccount.exist && key && key.token.length && (
                <iframe
                    title="svix"
                    id="iframe-svix"
                    src={getSvixConsumerPortalUrl(key.token)}
                    style={{ width: '77vw', height: '80vh', border: 'none', color: '#fff', marginLeft: '3vw' }}
                    allow="clipboard-write"
                    loading="lazy"
                />
            )}
        </div>
    );
}

export default Webhook;
