import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useUser } from '@clerk/clerk-react';
import { TailSpin } from 'react-loader-spinner';
import Modal from '@mui/material/Modal';
import EditCredentials from './editCredentials';
import { LOCALSTORAGE_KEYS } from '../data/localstorage';
import { useApi } from '../data/hooks';
import { LoadingButton } from '@mui/lab';
import MainHeader from '../layout/MainHeader';
import AddIntegration from '../features/integration/AddIntegration';
import CreatedIntegration from '../features/integration/CreatedIntegration';
import { useEnvironment } from '../hooks';

const Integrations = () => {
    const { environment } = useEnvironment();
    const user = useUser();
    const { data, loading, fetch, status } = useApi();

    const [account, setAccount] = useState<any>();
    const [open, setOpen] = React.useState(false);
    const [appId, setAppId] = useState<string>('');
    const [init, setInit] = useState<boolean>(false);
    const handleOpen = (id: string) => {
        setAppId(id);
        setOpen(true);
    };
    const apps = account?.environments?.find((x) => x.env === environment).apps || [];

    const handleClose = async ({ refetchOnClose = false }: { refetchOnClose?: boolean }) => {
        setOpen(false);
        if (refetchOnClose) {
            await fetchAccount();
        }
    };

    const handleCreation = async (id: string) => {
        const payload = {
            userId: user.user?.id,
            tpId: id,
            environment,
        };
        await fetch({
            url: '/internal/account/apps',
            method: 'POST',
            payload,
        });

        if (status?.toString().startsWith('2')) {
            setInit(false);
        }
    };

    const fetchAccount = React.useCallback(async () => {
        const payload = {
            userId: user.user?.id,
        };
        const res = await fetch({
            url: '/internal/account',
            method: 'POST',
            payload,
        });
    }, [fetch, user.user?.id]);

    useEffect(() => {
        if (open) {
            return;
        }
        fetchAccount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    React.useEffect(() => {
        setAccount(data?.account);
        localStorage.setItem(LOCALSTORAGE_KEYS.privateToken, data?.account?.private_token);
    }, [data]);

    return (
        <div className="w-[80vw] overflow-scroll over-scroll-auto">
            <MainHeader>
                <Box
                    component="div"
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                    className="text-lg mb-8"
                >
                    <h1 className="text-3xl font-bold mb-3">Integrations</h1>
                    <span className="text-[#b1b8ba]">Configure & Manage your connected apps here.</span>
                </Box>
                {!init && (
                    <Box>
                        <LoadingButton
                            variant="contained"
                            style={{ background: '#293347', padding: '0.6rem 1.4rem' }}
                            onClick={() => setInit(true)}
                        >
                            Create App
                        </LoadingButton>
                    </Box>
                )}
            </MainHeader>
            {loading ? (
                <div className="mt-10">
                    <TailSpin wrapperStyle={{ justifyContent: 'center' }} color="#1C1C1C" height={80} width={80} />
                </div>
            ) : (
                <>
                    {account ? (
                        <>
                            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                                <AddIntegration values={{ init, setInit, handleCreation, apps }} />
                            </Box>
                            <CreatedIntegration values={{ apps, handleOpen }} />
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

            <Modal open={open} onClose={handleClose}>
                <EditCredentials
                    app={account?.environments
                        ?.find((env) => env.env === environment)
                        ?.apps?.find((a) => a.tp_id === appId)}
                    handleClose={handleClose}
                />
            </Modal>
        </div>
    );
};

export default Integrations;
