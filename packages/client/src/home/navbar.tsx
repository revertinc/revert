import React from 'react';
import Logo from '../assets/images/logo.png';
import { SignedIn, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import QuizIcon from '@mui/icons-material/Quiz';
import EnvironmentSelector from './environmentSelector';
import GitHubButton from 'react-github-btn';

const Navbar = ({ workspaceName, environment, setEnvironment, environmentList }) => {
    return (
        <div id="top-navbar">
            <div className="flex justify-around items-center  ml-[1.5rem]">
                <Link to="/" className="flex justify-evenly items-center">
                    <img src={Logo} alt="revert_logo" className="w-[2rem] h-[2rem] mr-[1.5rem] cursor-pointer" />
                    <p className="text-[#fff]">{workspaceName}</p>
                </Link>
                <EnvironmentSelector
                    environmentProp={environment}
                    setEnvironmentProp={setEnvironment}
                    environmentList={environmentList}
                />
            </div>
            <div className="flex justify-center items-center">
                <a
                    href={'https://docs.revert.dev'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center cursor-pointer"
                >
                    <span className="m-3">
                        <QuizIcon /> Docs
                    </span>
                </a>
                <div className="mr-6 mt-1 ml-3">
                    <GitHubButton
                        href="https://github.com/revertinc/revert"
                        data-size="large"
                        data-icon="octicon-star"
                        aria-label="Star revertinc/revert on GitHub"
                        data-color-scheme="no-preference: dark_high_contrast; light: dark_high_contrast; dark: dark_high_contrast;"
                    >
                        Star us
                    </GitHubButton>
                </div>
                <SignedIn>
                    <div className="mr-4">
                        <UserButton afterSignOutUrl="/home" />
                    </div>
                </SignedIn>
            </div>
        </div>
    );
};

export default Navbar;
