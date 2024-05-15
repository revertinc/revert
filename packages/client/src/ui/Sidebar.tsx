import React from 'react';
import KeyIcon from '@mui/icons-material/Key';
import AppsIcon from '@mui/icons-material/Apps';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import HomeIcon from '@mui/icons-material/Home';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TaskIcon from '@mui/icons-material/Task';

const selectedStyle = {
    background: '#293347',
    color: '#89a3ff',
};

function Sidebar({ values }) {
    const { tabValue, handleChange } = values;
    return (
        <div className="w-[20%] flex flex-col items-center pt-[120px] text-[#94a3b8]">
            <ul>
                <li
                    className="p-2 cursor-pointer hover:bg-[#2c3957] rounded-[8px]"
                    style={tabValue === 0 ? selectedStyle : undefined}
                    onClick={() => handleChange(0)}
                >
                    <HomeIcon />
                    <span className="p-2">Home</span>
                </li>
                <li
                    className="p-2 cursor-pointer hover:bg-[#2c3957] rounded-[8px]"
                    style={tabValue === 1 ? selectedStyle : undefined}
                    onClick={() => handleChange(1)}
                >
                    <AppsIcon />
                    <span className="p-2">Integrations</span>
                </li>
                <li
                    className="p-2 cursor-pointer hover:bg-[#2c3957] rounded-[8px]"
                    style={tabValue === 2 ? selectedStyle : undefined}
                    onClick={() => handleChange(2)}
                >
                    <EqualizerIcon />
                    <span className="p-2">Analytics</span>
                </li>
                <li
                    className="p-2 cursor-pointer hover:bg-[#2c3957] rounded-[8px]"
                    style={tabValue === 3 ? selectedStyle : undefined}
                    onClick={() => handleChange(3)}
                >
                    <KeyIcon />
                    <span className="p-2">API Keys</span>
                </li>
                <li
                    className="p-2 cursor-pointer hover:bg-[#2c3957] rounded-[8px] mt-36"
                    onClick={() => {
                        var currentUrl = window.location.href;
                        window.open(
                            'https://docs.revert.dev?utm_campaign=docs-ui&utm_medium=dashboard&utm_source=' +
                                currentUrl,
                            '_blank'
                        );
                    }}
                >
                    <OpenInNewIcon />
                    <span className="p-2">Docs</span>
                </li>
                <li
                    className="p-2 cursor-pointer hover:bg-[#2c3957] rounded-[8px]"
                    onClick={() => {
                        var currentUrl = window.location.href;
                        window.open(
                            'https://discord.gg/q5K5cRhymW?utm_campaign=discord-ui&utm_medium=dashboard&utm_source=' +
                                currentUrl,
                            '_blank'
                        );
                    }}
                >
                    <TaskIcon />
                    <span className="p-2">Request Integration</span>
                </li>
            </ul>
        </div>
    );
}

export default Sidebar;
