import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import DescriptionIcon from '@mui/icons-material/Description';
import ChatIcon from '@mui/icons-material/Chat';

// Todo: Later Make Changes to Button CSS.
const CustomButton = styled(Button)({
    boxShadow: 'none',
    textTransform: 'none',
    fontSize: 16,
    padding: '6px 12px',
    border: '1px solid',
    lineHeight: 1.5,
    backgroundColor: '#293347',
    borderColor: '#2c3957',
    fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
    ].join(','),
    '&:hover': {
        backgroundColor: '#38486c',
        borderColor: '#2c3957',
        boxShadow: 'none',
    },
    '&:active': {
        boxShadow: 'none',
        backgroundColor: '#2047d0',
        borderColor: '#005cbf',
    },
    '&:focus': {
        boxShadow: '0 0 0 0.2rem rgba(0,123,255,.5)',
    },
});

const Onboarding = () => {
    return (
        <div className="w-[80vw]">
            <Box
                component="div"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    margin: '0 3rem',
                    marginTop: '8rem',
                }}
            >
                <div className="mb-6">
                    <h1 className="text-4xl font-bold mb-2">Welcome to Revert</h1>
                    <span className="text-xl">
                        At Revert, we believe there is a better way to build and manage integrations.
                    </span>
                </div>
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold mb-6">Here are some resources to help you get started </h1>
                    <ul>
                        <li className="mb-1">
                            <DescriptionIcon className="mr-2" />
                            <span>
                                Read our&nbsp;
                                <a
                                    href="https://docs.revert.dev"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold underline"
                                >
                                    Documentation
                                </a>
                            </span>
                        </li>
                        <li>
                            <ChatIcon className="mr-2" />
                            <span>
                                Join the conversation on our&nbsp;
                                <a
                                    href="https://discord.gg/q5K5cRhymW"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold underline"
                                >
                                    Discord
                                </a>
                            </span>
                        </li>
                    </ul>
                </div>
                <div>
                    <div className="mb-6">
                        <p className="text-xl font-semibold mb-3"> Alternatively, talk to us</p>
                        <a href="https://cal.com/jatinsandilya/chat-with-jatin-from-revert?utm_source=ui&utm_campaign=ui">
                            <img alt="or Book us with Cal.com" src="https://cal.com/book-with-cal-dark.svg" />
                        </a>
                    </div>
                    <div>
                        <p className="text-xl font-semibold mb-3"> Finally</p>
                        <CustomButton
                            variant="contained"
                            size="large"
                            href="https://docs.revert.dev/integration-guides/integration-guides/"
                        >
                            Explore Integrations
                        </CustomButton>
                    </div>
                </div>
            </Box>
        </div>
    );
};

export default Onboarding;
