import React from 'react';
import Logo from '../assets/images/logo.png';
import { SignedIn, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import QuizIcon from '@mui/icons-material/Quiz';
import EnvironmentSelector from './environmentSelector';

const Navbar = ({ environment, setEnvironment, environmentList }) => {
    return (
        <div id="top-navbar">
            <Link to="/" className="flex items-center">
                <img src={Logo} alt="revert_logo" className="w-[30px] h-[30px] ml-[24px] cursor-pointer mt-4 mb-3" />
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
                <SignedIn>
                    <div className="mr-4">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </SignedIn>
            </div>
        </div>
    );
};

export default Navbar;
