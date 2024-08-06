import React, { ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import Box from '@mui/material/Box';
import { useEnvironment } from '../../context/EnvironmentProvider';

function KeyContainer({ values, children }: { values: any; children?: ReactNode }) {
    const { account, data, secretOverlay } = values;
    const { environment } = useEnvironment();
    const currentEnvironmentAccount = account?.environments.find((e) => e.env === environment);

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '5rem',
            }}
        >
            <div
                style={{
                    padding: '2rem',
                    border: '1px #3E3E3E solid',
                    borderRadius: 10,
                    display: 'flex',
                    maxWidth: '85rem',
                }}
            >
                <div className="flex flex-col flex-1">
                    <p className="font-bold">{data.type}</p>
                    <span>{data.description}</span>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        flex: 2,
                    }}
                >
                    <div
                        style={{
                            background: '#1a1a1a',
                            textAlign: 'left',
                            padding: '24px',
                            color: '#fff',
                            margin: '20px',
                            fontSize: 'inherit',
                            borderRadius: 10,
                            marginBottom: 0,
                        }}
                    >
                        <div
                            style={{
                                position: 'relative',
                            }}
                        >
                            <div>
                                <pre
                                    onClick={() => {
                                        navigator.clipboard.writeText(currentEnvironmentAccount?.[data.access]);
                                        toast.success('Copied to clipboard!');
                                    }}
                                >
                                    <code
                                        className={`${data.access}`}
                                        title="Click to Copy"
                                        style={{
                                            display: 'block',
                                            whiteSpace: 'pre-wrap',
                                            cursor: 'pointer',
                                            ...secretOverlay,
                                        }}
                                    >
                                        {currentEnvironmentAccount?.[data.access]}
                                    </code>
                                </pre>
                                {children}
                            </div>
                        </div>
                    </div>
                    <span style={{ fontSize: 12, marginRight: 20 }}>Click above to copy</span>
                </div>
            </div>
        </Box>
    );
}

export default KeyContainer;
