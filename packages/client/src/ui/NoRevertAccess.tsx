import React from 'react';
import Box from '@mui/material/Box';

function NoRevertAccess({ children }: { children: string }) {
    return (
        <Box
            component="div"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '65vh',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            className="text-lg"
        >
            {children}
        </Box>
    );
}

export default NoRevertAccess;
