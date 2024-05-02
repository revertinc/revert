import Box from '@mui/material/Box';
import React, { ReactNode } from 'react';

function MainHeader({ children }: { children: ReactNode }) {
    return (
        <Box
            component="div"
            display="flex"
            flexDirection="row"
            sx={{ margin: '0 5rem', marginTop: '120px', justifyContent: 'space-between' }}
        >
            {children}
        </Box>
    );
}

export default MainHeader;
