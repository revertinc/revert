import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useUser } from '@clerk/clerk-react';
import { TailSpin } from 'react-loader-spinner';
import { REVERT_BASE_API_URL } from '../constants';
import { IconButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';

const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 24,
    pt: 2,
    px: 4,
    pb: 3,
};

const Integrations = () => {
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
                setLoading(false);
            })
            .catch((error) => {
                console.log('error', error);
                setLoading(false);
            });
    }, [user.user?.id]);

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
                <Box sx={{ ...style, width: 500 }}>
                    <h2 className="font-bold mt-4">Client ID: </h2>
                    <p>{account?.apps?.find((x) => x.tp_id === appId).app_client_id}</p>
                    <h2 className="font-bold mt-4">Client Secret: </h2>
                    <p>{account?.apps?.find((x) => x.tp_id === appId).app_client_secret}</p>
                    <h2 className="font-bold mt-4">Scopes: </h2>
                    <p className="break-words">{account?.apps?.find((x) => x.tp_id === appId).scope}</p>
                    <Button style={{ alignSelf: 'flex-end' }} onClick={handleClose}>
                        Close
                    </Button>
                </Box>
            </Modal>
        </div>
    );
};

export default Integrations;
