import Box from '@mui/material/Box';
import React, { ReactNode } from 'react';

function MainHeader({ children }: { children: ReactNode }) {
    return (
        <Box
            component="div"
            display="flex"
            flexDirection="row"
            sx={{ margin: '0 3rem', marginTop: '8rem', justifyContent: 'space-between' }}
        >
            {children}
        </Box>
    );
}

export default MainHeader;
