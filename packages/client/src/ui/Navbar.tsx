import React from 'react';

import GitHubButton from 'react-github-btn';
import QuizIcon from '@mui/icons-material/Quiz';
import Logo from '../assets/images/logo.png';

import { SignedIn, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

import EnvironmentSelector from './EnvironmentSelector';
import { useAccount } from '../context/AccountProvider';

const Navbar = () => {
    const { account } = useAccount();

    return (
        <div id="top-navbar">
            <div className="flex justify-around items-center  ml-[1.5rem]">
                <Link to="/" className="flex justify-evenly items-center">
                    <img src={Logo} alt="revert_logo" className="w-[2rem] h-[2rem] mr-[1.5rem] cursor-pointer" />
                    <p className="text-[#fff]">{account?.workspaceName}</p>
                </Link>
                <EnvironmentSelector environmentList={account?.environments} />
            </div>
            <div className="flex justify-around items-center w-[15rem]">
                <a
                    href={'https://docs.revert.dev'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center cursor-pointer"
                >
                    <span className="">
                        <QuizIcon /> Docs
                    </span>
                </a>
                <div className="">
                    <GitHubButton
                        href="https://github.com/revertinc/revert"
                        data-size="large"
                        data-icon="octicon-star"
                        aria-label="Star revertinc/revert on GitHub"
                        data-color-scheme="no-preference: dark_high_contrast; dark: dark_high_contrast; light: dark_high_contrast;"
                    >
                        Star us
                    </GitHubButton>
                </div>
                <SignedIn>
                    <div className="">
                        <UserButton afterSignOutUrl="/home" />
                    </div>
                </SignedIn>
            </div>
        </div>
    );
};

export default Navbar;
