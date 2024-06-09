import { Box } from '@mui/material';
import Modal from '@mui/material/Modal';
import React, { useState } from 'react';
import { appsInfo } from './enums/metadata';
import { LoadingButton } from '@mui/lab';

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
    const [selected, setSelected] = useState<string>('');
    const { init, setInit, handleCreation, apps } = values;
    const appsId = apps.map((app) => app.tp_id);
    return (
        <Modal
            open={init}
            onClose={() => {
                setInit(false);
                setSelected('');
            }}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            sx={{ backgroundColor: '#293347', width: '70vw', margin: '10vh 20vw 10vh 20vw', maxHeight: '80vh' }}
            className="rounded-xl overflow-hidden"
        >
            <div className="flex flex-col h-[80vh]">
                <Box component="div" sx={{ width: '70vw', padding: '2rem 3rem 0rem 3rem', marginBottom: '1.6rem' }}>
                    <h1 className="text-3xl font-bold text-[#fff]">Create App</h1>
                    <span className="text-[#b1b8ba]">
                        Select and click add to configure a new app for an integration
                    </span>
                </Box>
                <div className="h-[60vh] overflow-scroll">
                    <div className="grid grid-cols-4 gap-8 justify-center content-center mx-8 my-4">
                        {Object.keys(appsInfo).map((app, index) => {
                            const isAppExist = appsId.includes(app);
                            return (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        pointerEvents: isAppExist ? 'none' : 'initial',
                                        cursor: isAppExist ? 'not-allowed' : 'pointer',
                                        backgroundColor: isAppExist && '#181d28',
                                    }}
                                >
                                    <div
                                        className="flex w-full justify-around items-center px-8 py-8 rounded-lg"
                                        style={{
                                            boxShadow:
                                                app === selected
                                                    ? '0 0 0 3px #fff'
                                                    : isAppExist
                                                    ? '0 0 0 1px #ffa8a8'
                                                    : '0 0 0 1px #ced4da',
                                        }}
                                        onClick={() => setSelected(app)}
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
                </div>
                <div className="flex justify-end mr-8 mb-8 mt-auto">
                    <LoadingButton
                        style={{
                            background: '#293347',
                            padding: '0.6rem 1.2rem',
                            color: '#fff',
                            textTransform: 'capitalize',
                        }}
                        disabled={selected === ''}
                        onClick={() => {
                            handleCreation(selected);
                        }}
                    >
                        Add
                    </LoadingButton>
                </div>
            </div>
        </Modal>
    );
}

export default AddIntegration;
