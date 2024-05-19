import React, { useState } from 'react';
import { TailSpin } from 'react-loader-spinner';

import { useAccount } from '../../context/AccountProvider';
import NoRevertAccess from '../../ui/NoRevertAccess';
import KeyContainer from './KeyContainer';

import Box from '@mui/material/Box';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const data = {
    public: {
        access: 'public_token',
        type: 'Publishable key',
        description: `This key should be used in your frontend code, can be safely shared, and does not need to be
        kept secret.`,
    },
    private: {
        access: 'private_token',
        type: 'Secret key',
        description: `These are the secret keys to be used from your backend code. They are sensitive and
    should be deleted if leaked.`,
    },
};

const ApiKeys = () => {
    const { account, loading } = useAccount();
    const [viewSecret, setViewSecret] = useState<boolean>(false);

    const secretOverlay = {
        textShadow: 'white 0px 0px 6px',
        color: '#00000000',
    };

    return (
        <div className="w-[80vw] overflow-auto">
            <Box
                component="div"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    margin: '0 3rem',
                    marginTop: '8rem',
                }}
                className="text-lg"
            >
                <h1 className="text-3xl font-bold mb-3">API Keys</h1>
                <span>Manage your Revert API keys here</span>
            </Box>
            {loading && (
                <div className="mt-10">
                    <TailSpin
                        wrapperStyle={{ justifyContent: 'center', marginTop: '28vh' }}
                        color="#1C1C1C"
                        height={80}
                        width={80}
                    />
                </div>
            )}
            {!loading && account && (
                <div className="overflow-scroll">
                    <KeyContainer values={{ account, data: data.public }} />
                    <KeyContainer
                        values={{ account, data: data.private, secretOverlay: viewSecret ? {} : secretOverlay }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: -24,
                                right: -20,
                                cursor: 'pointer',
                            }}
                        >
                            {viewSecret ? (
                                <VisibilityIcon onClick={() => setViewSecret(false)} />
                            ) : (
                                <VisibilityOffIcon onClick={() => setViewSecret(true)} />
                            )}
                        </div>
                    </KeyContainer>
                </div>
            )}
            {!loading && !account && (
                <NoRevertAccess>
                    You don't seem to have access to the Revert, please contact us at team@revert.dev.
                </NoRevertAccess>
            )}
        </div>
    );
};

export default ApiKeys;
