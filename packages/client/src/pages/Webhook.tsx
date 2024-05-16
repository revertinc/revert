import React, { useState } from 'react';
import MainHeader from '../layout/MainHeader';
import { Box } from '@mui/material';
import { LoadingButton } from '@mui/lab';

function Webhook() {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <div className="w-[80vw]">
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
                    <span className="text-[#b1b8ba]">Manage your webhooks and linked events</span>
                </Box>
                {!open && (
                    <Box>
                        <LoadingButton
                            variant="text"
                            style={{
                                background: '#293347',
                                color: '#fff',
                                padding: '0.6rem 1.4rem',
                                textTransform: 'capitalize',
                            }}
                            onClick={() => setOpen(true)}
                        >
                            Webhook
                        </LoadingButton>
                    </Box>
                )}
            </MainHeader>
        </div>
    );
}

export default Webhook;
