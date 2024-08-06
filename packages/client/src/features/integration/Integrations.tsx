import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useUser } from '@clerk/clerk-react';
import Modal from '@mui/material/Modal';
import EditCredentials from './EditCredentials';
import { LOCALSTORAGE_KEYS } from '../../data/localstorage';
import { useApi } from '../../data/hooks';
import { LoadingButton } from '@mui/lab';
import MainHeader from '../../layout/MainHeader';
import AddIntegration from './AddIntegration';
import CreatedIntegration from './CreatedIntegration';
import { useEnvironment } from '../../context/EnvironmentProvider';
import NoRevertAccess from '../../ui/NoRevertAccess';
import Spinner from '../../ui/Spinner';
import toast from 'react-hot-toast';
import { appsInfo } from './enums/metadata';

// Todo: Migrate to useAccount
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

        toast.success(`Added ${appsInfo[id].name} !`, {
            position: 'top-center',
        });
    };

    const fetchAccount = React.useCallback(async () => {
        const payload = {
            userId: user.user?.id,
        };
        await fetch({
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
                {!init && account && (
                    <Box>
                        <LoadingButton
                            style={{
                                background: '#293347',
                                padding: '0.6rem 1.4rem',
                                color: '#fff',
                                textTransform: 'capitalize',
                            }}
                            onClick={() => setInit(true)}
                        >
                            Create App
                        </LoadingButton>
                    </Box>
                )}
            </MainHeader>
            {loading ? (
                <Spinner />
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
                        <NoRevertAccess>
                            You don't seem to have access to the Revert, please contact us at team@revert.dev.
                        </NoRevertAccess>
                    )}
                </>
            )}

            <Modal open={open} onClose={handleClose}>
                <div>
                    <EditCredentials
                        app={account?.environments
                            ?.find((env) => env.env === environment)
                            ?.apps?.find((a) => a.tp_id === appId)}
                        handleClose={handleClose}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default Integrations;
