import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useUser } from '@clerk/clerk-react';
import { TailSpin } from 'react-loader-spinner';
import { IconButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import Modal from '@mui/material/Modal';
import EditCredentials from './editCredentials';
import { LOCALSTORAGE_KEYS } from '../data/localstorage';
import { useApi } from '../data/hooks';
import { LoadingButton } from '@mui/lab';
import MainHeader from '../layout/MainHeader';

const Integrations = ({ environment }) => {
    const user = useUser();
    const { data, loading, fetch } = useApi();

    const [account, setAccount] = useState<any>();
    const [open, setOpen] = React.useState(false);
    const [appId, setAppId] = useState<string>('sfdc');
    const [init, setInit] = useState<boolean>(false);

    const handleOpen = (appId: string) => {
        setAppId(appId);
        setOpen(true);
    };
    // TODO: Get this from API.
    const integrations = [
        {
            name: 'Hubspot',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711548892/Revert/v8xy74cep10cjuitlnpk.png',
            description: 'Configure your Hubspot App from here.',
            onClick: () => handleOpen('hubspot'),
        },
        {
            name: 'Salesforce',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711548963/Revert/by6ckdbnibuniorebwxj.png',
            description: 'Configure your Salesforce App from here.',
            onClick: () => handleOpen('sfdc'),
        },
        {
            name: 'ZohoCRM',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711549106/Revert/lig4v85hfhshob9w6z9z.png',
            description: 'Configure your Zoho CRM App from here.',
            onClick: () => handleOpen('zohocrm'),
        },
        {
            name: 'Pipedrive',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711548714/Revert/opggbicfjuskkxnflysm.png',
            description: 'Configure your Pipedrive App from here.',
            onClick: () => handleOpen('pipedrive'),
        },
        {
            name: 'Close CRM',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711548783/Revert/mrfg9qcxzh5r2iyatjdg.png',
            description: 'Configure your Close CRM App from here.',
            onClick: () => handleOpen('closecrm'),
        },
        {
            name: 'MS Dynamics Sales',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711549741/Revert/pbvr2f2yszrt5ithbirb.png',
            description: 'Configure your MS Dynamics 365 Sakes App from here.',
            onClick: () => handleOpen('ms_dynamics_365_sales'),
        },
        {
            name: 'Slack Chat',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711550376/Revert/gei0ux6iptaf1nfxjfv2.png',
            description: 'Configure your Slack Chat App from here.',
            onClick: () => handleOpen('slack'),
        },
        {
            name: 'Discord Chat',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711550278/Revert/sgbdv2n10bajbykvtxl4.png',
            description: 'Configure your Discord Chat App from here.',
            onClick: () => handleOpen('discord'),
        },
        {
            name: 'Linear',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711549244/Revert/v8r7gnqe0tzoozwbhnyn.png',
            description: 'Configure your Linear Ticketing App from here.',
            onClick: () => handleOpen('linear'),
        },
        {
            name: 'Clickup',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711549293/Revert/ooo7iegqcrdkxgrclzjt.png',
            description: 'Configure your Clickup Ticketing App from here.',
            onClick: () => handleOpen('clickup'),
        },
        {
            name: 'Jira',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711549557/Revert/tsjway6elov5bv1tc5tk.png',
            description: 'Configure your Jira Ticketing App from here.',
            onClick: () => handleOpen('jira'),
        },
        {
            name: 'Trello',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711549291/Revert/caydzlxzcitdu2n9yuea.png',
            description: 'Configure your Trello Ticketing App from here.',
            onClick: () => handleOpen('trello'),
        },

        {
            name: 'Bitbucket',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1711549311/Revert/cmqpors8m8tid9zpn9ak.png',
            description: 'Configure your Bitbucket Ticketing App from here.',
            onClick: () => handleOpen('bitbucket'),
        },
    ];
    const handleClose = async ({ refetchOnClose = false }: { refetchOnClose?: boolean }) => {
        setOpen(false);
        if (refetchOnClose) {
            await fetchAccount();
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
        if (open) return;
        fetchAccount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    React.useEffect(() => {
        setAccount(data?.account);
        localStorage.setItem(LOCALSTORAGE_KEYS.privateToken, data?.account?.private_token);
    }, [data]);

    return (
        <div className="w-[80%]">
            <MainHeader>
                <Box
                    component="div"
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                    className="text-lg"
                >
                    <h1 className="text-3xl font-bold mb-3">Integrations</h1>
                    <span className="text-[#b1b8ba]">Configure & Manage your connected apps here.</span>
                </Box>
                <Box>
                    <LoadingButton
                        variant="contained"
                        style={{ background: '#293347', padding: '0.6rem 1.4rem' }}
                        onClick={() => setInit(true)}
                    >
                        Create New Integration
                    </LoadingButton>
                </Box>
            </MainHeader>
            {loading ? (
                <div className="mt-10">
                    <TailSpin wrapperStyle={{ justifyContent: 'center' }} color="#1C1C1C" height={80} width={80} />
                </div>
            ) : (
                <>
                    {account ? (
                        <div
                            className="flex justify-between flex-wrap items-start gap-4"
                            style={{ padding: '2rem 5rem', width: '80%' }}
                        >
                            {integrations.map((integration, index) => (
                                <Box
                                    key={index}
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
                                            border: '1px #3E3E3E solid',
                                            borderRadius: 10,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            height: 200,
                                            justifyContent: 'flex-end',
                                            position: 'relative',
                                        }}
                                    >
                                        <img
                                            width={100}
                                            style={{ maxHeight: 40, objectFit: 'scale-down', objectPosition: 'left' }}
                                            alt={`${integration.name} logo`}
                                            src={integration.logo}
                                        />
                                        <p className="font-bold mt-4">{integration.name}</p>
                                        <span className="text-[#b1b8ba]">{integration.description}</span>
                                        <IconButton
                                            onClick={integration.onClick}
                                            style={{
                                                color: '#94a3b8',
                                                fontSize: 12,
                                                position: 'absolute',
                                                top: 10,
                                                right: 10,
                                            }}
                                        >
                                            <SettingsIcon />
                                        </IconButton>
                                    </div>
                                </Box>
                            ))}
                        </div>
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
