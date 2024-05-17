import React from 'react';
import MainHeader from '../layout/MainHeader';
import { Box } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useSvixAccount } from '../context/SvixAccountProvider';
import { TailSpin } from 'react-loader-spinner';
import { useApi } from '../data/hooks';
import { useEnvironment } from '../context/EnvironmentProvider';
import { useAccount } from '../context/AccountProvider';

function Webhook() {
    const { loading, isExist, setSvixAccount } = useSvixAccount();
    const { environment } = useEnvironment();
    const { account } = useAccount();
    const { fetch, data } = useApi();
    // const svixInfo = {
    //     url: 'https://app.svix.com/login?primaryColorLight=&primaryColorDark=94a3b8&darkMode=true#key=',
    // };

    async function handleCreation() {
        await fetch({
            method: 'POST',
            url: `/internal/account/svix`,
            payload: {
                environment,
                accountId: account?.id,
            },
        });

        setSvixAccount(data);
    }

    return (
        <div className="w-[80vw]">
            {loading && (
                <TailSpin
                    wrapperStyle={{ justifyContent: 'center', marginTop: '100px' }}
                    color="#1C1C1C"
                    height={80}
                    width={80}
                />
            )}
            {!isExist && !loading && (
                <>
                    <MainHeader>
                        <Box
                            component="div"
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                            className="text-lg mb-8"
                        >
                            <h1 className="text-3xl font-bold mb-3">Webhooks</h1>
                            <span className="text-[#b1b8ba]">Enable Webhooks</span>
                        </Box>

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
                    </MainHeader>
                    <div className="flex flex-col justify-center items-center h-[70vh] w-[80vw]">
                        <p>Enable webhooks to start configure </p>
                    </div>
                </>
            )}
            {isExist && !loading && (
                <p>Dashboard</p>
                // <iframe
                //     title="svix"
                //     id="iframe-svix"
                //     src={svixInfo.url}
                //     style={{ width: '80vw', height: '100%', border: 'none', color: '#fff' }}
                //     allow="clipboard-write"
                //     loading="lazy"
                // />
            )}
        </div>
    );
}

export default Webhook;
