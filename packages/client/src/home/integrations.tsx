import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useUser } from '@clerk/clerk-react';
import { TailSpin } from 'react-loader-spinner';
import { REVERT_BASE_API_URL } from '../constants';
import { IconButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import Modal from '@mui/material/Modal';
import EditCredentials from './editCredentials';
import { LOCALSTORAGE_KEYS } from '../data/localstorage';

const Integrations = ({ environment }) => {
    const user = useUser();
    const [account, setAccount] = useState<any>();
    const [isLoading, setLoading] = useState<boolean>(false);
    const [viewSecret, setViewSecret] = useState<boolean>(false);
    const [open, setOpen] = React.useState(false);
    const [appId, setAppId] = useState<string>('sfdc');

    const handleOpen = (appId: string) => {
        setAppId(appId);
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    useEffect(() => {
        if (open) return;
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');

        const data = JSON.stringify({
            userId: user.user?.id,
        });
        const requestOptions = {
            method: 'POST',
            body: data,
            headers: headers,
        };
        setLoading(true);
        fetch(`${REVERT_BASE_API_URL}/internal/account`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                setAccount(result?.account);
                localStorage.setItem(LOCALSTORAGE_KEYS.privateToken, result?.account.private_token);
                setLoading(false);
            })
            .catch((error) => {
                console.log('error', error);
                setLoading(false);
            });
    }, [user.user?.id, environment, open]);

    let secretOverlay = {};
    if (!viewSecret) {
        secretOverlay = {
            textShadow: 'white 0px 0px 6px',
            color: '#00000000',
        };
    }

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
            {isLoading ? (
                <div className="mt-10">
                    <TailSpin wrapperStyle={{ justifyContent: 'center' }} color="#1C1C1C" height={80} width={80} />
                </div>
            ) : (
                <>
                    {account ? (
                        <div
                            className="flex justify-between flex-wrap items-start"
                            style={{ padding: '0rem 5rem', width: '80%' }}
                        >
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
                                        alt="Hubspot logo"
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
                    app={account?.apps
                        ?.find((app) => app.find((a) => a.env === environment))
                        ?.find((a) => a.tp_id === appId)}
                    handleClose={handleClose}
                    setAccount={setAccount}
                />
            </Modal>
        </div>
    );
};

export default Integrations;
