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
        <div className="grid md:grid-cols-2 gap-y-8 gap-x-8 ml-12 mr-8 mb-8 justify-items-stretch lg:grid-cols-3">
            {apps.map((app, index) => {
                const type = appsInfo?.[app.tp_id];
                return (
                    <Box key={index} className="flex items-center">
                        <div
                            className="flex flex-col justify-end items-start h-[12.5rem] w-full relative px-5 py-10"
                            style={{
                                border: '1px #3E3E3E solid',
                                borderRadius: 10,
                            }}
                        >
                            <img
                                className="max-h-[2rem] max-w-[7rem]"
                                style={{
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
