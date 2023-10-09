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
            <Link to="/" className="flex items-center">
                <img
                    src={Logo}
                    alt="revert_logo"
                    className="w-[30px] h-[30px] ml-[24px] cursor-pointer mt-4 mb-3 mr-[24px]"
                />
                <span className="ml-[24px] mr-[12px]">{workspaceName}</span>
                <EnvironmentSelector
                    environmentProp={environment}
                    setEnvironmentProp={setEnvironment}
                    environmentList={environmentList}
                />
            </Link>
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
