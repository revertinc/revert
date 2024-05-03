import { Box } from '@mui/material';
import Modal from '@mui/material/Modal';
import React from 'react';
import { appsInfo } from './enums/metadata';

function AddIntegration({
    values,
}: {
    values: {
        init: boolean;
        setInit: React.Dispatch<React.SetStateAction<boolean>>;
        handleCreation: (id: string) => Promise<void>;
        apps: any;
    };
}) {
    const { init, setInit, handleCreation, apps } = values;
    const appsId = apps.map((app) => app.tp_id);
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
                    <h1 className="text-3xl font-bold text-[#fff]">Create Integration</h1>
                    <span className="text-[#b1b8ba]">Click to Configure New Integration</span>
                </Box>
                <div className="grid grid-cols-4 gap-8 justify-center content-center mx-8">
                    {Object.keys(appsInfo).map((app, index) => {
                        const isAppExist = appsId.includes(app);
                        return (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    pointerEvents: isAppExist ? 'none' : 'initial',
                                    backgroundColor: isAppExist && '#181d28',
                                }}
                            >
                                <div
                                    className="flex w-full justify-around items-center px-8 py-8 rounded-lg"
                                    style={{
                                        border: isAppExist ? '1px #ff8787 solid' : '0.5px #ced4da solid',
                                    }}
                                    onClick={() => {
                                        handleCreation(app);
                                    }}
                                >
                                    <img
                                        width={100}
                                        style={{
                                            height: 40,
                                            objectFit: 'scale-down',
                                        }}
                                        alt={`${appsInfo[app].name} logo`}
                                        src={appsInfo[app].logo}
                                    />
                                </div>
                            </Box>
                        );
                    })}
                </div>
            </>
        </Modal>
    );
}

export default AddIntegration;
