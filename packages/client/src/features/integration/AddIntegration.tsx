import { Box } from '@mui/material';
import Modal from '@mui/material/Modal';
import React from 'react';

function AddIntegration({
    values,
}: {
    values: {
        init: boolean;
        setInit: React.Dispatch<React.SetStateAction<boolean>>;
        integrations: Array<any>;
    };
}) {
    const { init, setInit, integrations } = values;
    return (
        <Modal
            open={init}
            onClose={() => setInit(false)}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            sx={{ backgroundColor: '#293347', width: '70vw', margin: '10vh 20vw 10vh 20vw' }}
            className="rounded-xl overflow-scroll"
        >
            <>
                <Box component="div" sx={{ margin: '3rem' }}>
                    <h1 className="text-3xl font-bold mb-3 text-[#fff]">Create Integration</h1>
                    <span className="text-[#b1b8ba]"></span>
                </Box>
                <div className="grid grid-cols-4 gap-8 justify-center content-center mx-8">
                    {integrations.map((integration, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div
                                className="flex w-full justify-around items-center px-8 py-8 rounded-lg"
                                style={{
                                    border: '1px #3E3E3E solid',
                                }}
                            >
                                <img
                                    width={100}
                                    style={{
                                        height: 40,
                                        objectFit: 'scale-down',
                                    }}
                                    alt={`${integration.name} logo`}
                                    src={integration.logo}
                                />
                            </div>
                        </Box>
                    ))}
                </div>
            </>
        </Modal>
    );
}

export default AddIntegration;
