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

const Integrations = ({ environment }) => {
    const user = useUser();
    const { data, loading, fetch } = useApi();

    const [account, setAccount] = useState<any>();
    const [open, setOpen] = React.useState(false);
    const [appId, setAppId] = useState<string>('sfdc');

    const handleOpen = (appId: string) => {
        setAppId(appId);
        setOpen(true);
    };
    // TODO: Get this from API.
    const integrations = [
        {
            name: 'Salesforce',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1688550774/Revert/image_8_2_peddol.png',
            description: 'Configure your Salesforce App from here.',
            onClick: () => handleOpen('sfdc'),
        },
        {
            name: 'Hubspot',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1688550714/Revert/image_9_1_vilmhw.png',
            description: 'Configure your Hubspot App from here.',
            onClick: () => handleOpen('hubspot'),
        },
        {
            name: 'ZohoCRM',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1688550788/Revert/image_10_xvb9h7.png',
            description: 'Configure your Zoho CRM App from here.',
            onClick: () => handleOpen('zohocrm'),
        },
        {
            name: 'Pipedrive',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1688633518/Revert/PipedriveLogo.png',
            description: 'Configure your Pipedrive App from here.',
            onClick: () => handleOpen('pipedrive'),
        },
        {
            name: 'Slack Chat',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1697800654/Revert/txfq0qixzprqniuc0wry.png',
            description: 'Configure your Slack Chat App from here.',
            onClick: () => handleOpen('slack'),
        },
        {
            name: 'Close CRM',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/c_scale,w_136/Revert/o8kv3xqzoqioupz0jpnl.jpg',
            description: 'Configure your Close CRM App from here.',
            onClick: () => handleOpen('closecrm'),
        },
        {
            name: 'Discord Chat',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/c_scale,w_136/v1701337535/Revert/qorqmz5ggxbb5ckywmxm.png',
            description: 'Configure your Discord Chat App from here.',
            onClick: () => handleOpen('discord'),
        },
        {
            name: 'Linear',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1702974919/Revert/v5e5z6afm5iepiy3cvex.png',
            description: 'Configure your Linear Ticketing App from here.',
            onClick: () => handleOpen('linear'),
        },
        {
            name: 'Clickup',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1702974919/Revert/zckjrxorttrrmyuxf1hu.png',
            description: 'Configure your Clickup Ticketing App from here.',
            onClick: () => handleOpen('clickup'),
        },
        {
            name: 'Jira',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1702983006/Revert/szfzkoagws7h3miptezo.png',
            description: 'Configure your Jira Ticketing App from here.',
            onClick: () => handleOpen('jira'),
        },
        {
            name: 'Trello',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1705315257/Revert/abt6asvtvdqhzgadanwx.png',
            description: 'Configure your Trello Ticketing App from here.',
            onClick: () => handleOpen('trello'),
        },
        {
            name: 'MS Dynamics Sales',
            logo: 'https://res.cloudinary.com/dfcnic8wq/image/upload/v1707715552/Revert/mecum34mxpxirpi1obxd.png',
            description: 'Configure your MS Dynamics 365 Sakes App from here.',
            onClick: () => handleOpen('ms_dynamics_365_sales'),
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
                <h1 className="text-3xl font-bold mb-3">Integrations</h1>
                <span className="text-[#080d19ab]">Configure & Manage your connected apps here.</span>
            </Box>
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
                                            border: '2px #d1d9f2 solid',
                                            borderRadius: 10,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            height: 200,
                                            justifyContent: 'flex-end',
                                            position: 'relative',
                                        }}
                                    >
                                        <img width={100} alt={`${integration.name} logo`} src={integration.logo} />
                                        <p className="font-bold mt-4">{integration.name}</p>
                                        <span className="text-[#080d19ab]">{integration.description}</span>
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
