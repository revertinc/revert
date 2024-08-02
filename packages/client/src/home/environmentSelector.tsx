import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

export default function EnvironmentSelector({ environmentProp, setEnvironmentProp, environmentList }) {
    const handleChange = (event: SelectChangeEvent) => {
        event.preventDefault();
        setEnvironmentProp(event.target.value);
    };
    const anchorRef = React.useRef<HTMLDivElement>(null);
    return (
        <FormControl sx={{ m: 1, minWidth: 120, background: '#1c212e', borderRadius: 10, marginLeft: 3 }} size="small">
            <div ref={anchorRef}>
                <Select
                    style={{
                        borderRadius: 10,
                    }}
                    labelId="environment-selector"
                    id="environment-selector"
                    value={environmentProp}
                    defaultValue={environmentProp}
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
                        //   anchorEl: anchorRef.current,
                        // FIXME: disablePortal: true, still doesn't fix the re-render issue
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
                        '.MuiSvgIcon-root ': {
                            fill: '#89a3ff !important',
                        },
                    }}
                    className="capitalize"
                >
                    {environmentList?.map((e) => (
                        <MenuItem
                            value={e.env}
                            className="capitalize"
                            key={e.env}
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
                            {e.env}
                        </MenuItem>
                    ))}
                </Select>
            </div>
        </FormControl>
    );
}
