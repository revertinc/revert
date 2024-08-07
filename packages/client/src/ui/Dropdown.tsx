import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';

function Dropdown({ value, set }: { value: any; set }) {
    const handleChange = (event: SelectChangeEvent) => {
        event.preventDefault();
        set(event.target.value);
    };

    const environment = ['Sandbox', 'Production'];

    return (
        <Select
            style={{
                borderRadius: 10,
            }}
            value={value}
            onChange={handleChange}
            SelectDisplayProps={{
                style: {
                    color: '#89a3ff',
                },
            }}
            MenuProps={{
                anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                },
                transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                },
                PaperProps: {
                    style: {
                        background: '#1c212e',
                    },
                },
            }}
            sx={{
                color: '#89a3ff',
                '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(228, 219, 233, 0.25)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(228, 219, 233, 0.25)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(228, 219, 233, 0.25)',
                },
                '.MuiSvgIcon-root': {
                    fill: '#89a3ff !important',
                },
            }}
            className="capitalize"
        >
            {environment.map((e) => (
                <MenuItem
                    value={e}
                    className="capitalize"
                    key={e}
                    sx={{
                        background: '#080d19',
                        '&:hover': {
                            background: '#38486c',
                        },
                        '&&.Mui-selected': {
                            backgroundColor: '#2c3957',
                        },
                        '&.Mui-selected:hover': {
                            backgroundColor: '#475b89',
                        },
                    }}
                >
                    {e}
                </MenuItem>
            ))}
        </Select>
    );
}

export default Dropdown;
