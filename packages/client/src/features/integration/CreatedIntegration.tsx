import React from 'react';
import { Box, IconButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { appsInfo } from './enums/metadata';

function CreatedIntegration({
    values,
}: {
    values: {
        apps: any;
        handleOpen: (appId: string) => void;
    };
}) {
    const { handleOpen, apps } = values;

    if (!apps.length) {
        return (
            <div className="flex flex-col justify-center items-center h-[77vh] w-[80vw]">
                <p>No apps have been created; create and configure your first app for an integration</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-4 gap-8">
            {apps.map((app, index) => {
                const type = appsInfo?.[app.tp_id];
                return (
                    <Box
                        key={index}
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '2rem 0rem',
                            maxWidth: '22rem',
                            maxHeight: '12.5rem',
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
                                style={{
                                    maxHeight: 40,
                                    objectFit: 'scale-down',
                                    objectPosition: 'left',
                                }}
                                alt={`${type?.name} logo`}
                                src={type?.logo}
                            />
                            <p className="font-bold mt-4">{type?.name}</p>
                            <span className="text-[#b1b8ba]">{type?.description}</span>
                            <IconButton
                                onClick={() => handleOpen(app.tp_id)}
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
                );
            })}
        </div>
    );
}

export default CreatedIntegration;
