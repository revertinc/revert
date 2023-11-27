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
                <span>Configure & Manage your connected apps here.</span>
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
                            style={{ padding: '3rem 5rem', width: '80%' }}
                        >
                            <Box
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
                                        border: '2px #00000029 solid',
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
                                        alt="SFDC logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1688550774/Revert/image_8_2_peddol.png"
                                    />
                                    <p className="font-bold mt-4">Salesforce</p>
                                    <span>Configure your Salesforce App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('sfdc')}
                                        style={{
                                            color: '#6e6e6e',
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
                            <Box
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
                                        border: '2px #00000029 solid',
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
                                        alt="Hubspot logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1688550714/Revert/image_9_1_vilmhw.png"
                                    />
                                    <p className="font-bold mt-4">Hubspot</p>
                                    <span>Configure your Hubspot App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('hubspot')}
                                        style={{
                                            color: '#6e6e6e',
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
                            <Box
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
                                        border: '2px #00000029 solid',
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
                                        alt="Zoho CRM logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1688550788/Revert/image_10_xvb9h7.png"
                                    />
                                    <p className="font-bold mt-4">ZohoCRM</p>
                                    <span>Configure your Zoho CRM App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('zohocrm')}
                                        style={{
                                            color: '#6e6e6e',
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
                            <Box
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
                                        border: '2px #00000029 solid',
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
                                        alt="Pipedrive logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1688633518/Revert/PipedriveLogo.png"
                                    />
                                    <p className="font-bold mt-4">Pipedrive</p>
                                    <span>Configure your Pipedrive App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('pipedrive')}
                                        style={{
                                            color: '#6e6e6e',
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
                            <Box
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
                                        border: '2px #00000029 solid',
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
                                        alt="Slack logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1697800654/Revert/txfq0qixzprqniuc0wry.png"
                                    />
                                    <p className="font-bold mt-4">Slack Chat</p>
                                    <span>Configure your Slack Chat App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('slack')}
                                        style={{
                                            color: '#6e6e6e',
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
                            <Box
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
                                        border: '2px #00000029 solid',
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
                                        alt="Close CRM logo"
                                        src="https://res.cloudinary.com/dfcnic8wq/image/upload/c_scale,w_136/Revert/o8kv3xqzoqioupz0jpnl.jpg"
                                    />
                                    <p className="font-bold mt-4">Close CRM</p>
                                    <span>Configure your Close CRM App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('closecrm')}
                                        style={{
                                            color: '#6e6e6e',
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
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '2rem 0rem',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 30,
                                        border: '2px #00000029 solid',
                                        borderRadius: 10,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        minHeight: 200,
                                        justifyContent: 'flex-end',
                                        position: 'relative',
                                    }}
                                >
                                    <img
                                        width={100}
                                        alt="Discord logo"
                                        src="https://1000logos.net/wp-content/uploads/2021/06/Discord-logo-768x432.png"
                                    />
                                    <p className="font-bold mt-4">Discord Chat</p>
                                    <span>Configure your Discord Chat App from here.</span>
                                    <IconButton
                                        onClick={() => handleOpen('discord')}
                                        style={{
                                            color: '#6e6e6e',
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
