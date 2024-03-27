import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import DescriptionIcon from '@mui/icons-material/Description';
import ChatIcon from '@mui/icons-material/Chat';

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

const ApiKeys = ({ changeTabs }) => {
    return (
        <div className="w-[80%]">
            <Box
                component="div"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0 5rem',
                    paddingTop: '120px',
                }}
                className="text-lg"
            >
                <h1 className="text-3xl font-bold mb-3">Welcome to Revert </h1>
                <span>At Revert, we believe there is a better way to build and manage integrations.</span>
                <div className="mt-4 ">
                    <h1 className="text-l font-bold mt-3">Here are some resources to help you get started </h1>
                    <br />
                    <ul className="">
                        <li>
                            <DescriptionIcon className="mr-1" />
                            Read our
                            <a href="https://docs.revert.dev" target="_blank" rel="noreferrer" className="font-bold">
                                {' '}
                                documentation.
                            </a>
                        </li>
                        <li>
                            <ChatIcon className="mr-1" />
                            Join the conversation on our{' '}
                            <a
                                href="https://discord.gg/q5K5cRhymW"
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold"
                            >
                                Discord.
                            </a>
                            <br />
                        </li>
                    </ul>
                    <p className="mt-4">
                        <p className="text-l font-bold mt-3 mb-3"> Alternatively, talk to us</p>
                        <a href="https://cal.com/jatinsandilya/chat-with-jatin-from-revert?utm_source=ui&utm_campaign=ui">
                            <img alt="or Book us with Cal.com" src="https://cal.com/book-with-cal-dark.svg" />
                        </a>
                        <p className="text-l font-bold mt-4 mb-3"> Finally</p>
                        <CustomButton variant="contained" size="large" onClick={changeTabs}>
                            Explore Integrations
                        </CustomButton>
                    </p>
                </div>
            </Box>
        </div>
    );
};

export default ApiKeys;
