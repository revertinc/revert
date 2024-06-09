import React, { ReactNode } from 'react';

function AnalyticContainer({ children }: { children: ReactNode }) {
    return (
        <div
            style={{
                padding: 30,
                border: '1px #3E3E3E solid',
                borderRadius: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                position: 'relative',
                width: '100%',
                height: '15vh',
            }}
        >
            {children}
        </div>
    );
}

export default AnalyticContainer;
