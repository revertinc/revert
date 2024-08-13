import './App.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { RouterComponent } from './routes';
import React from 'react';

const darkTheme = createTheme({
    palette: {
        primary: {
            main: '#00949D',
        },
        secondary: {
            main: '#3B3B3B',
        },
        mode: 'dark',
    },
});

function App() {
    return (
        <ThemeProvider theme={darkTheme}>
            <BrowserRouter>
                <RouterComponent></RouterComponent>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
