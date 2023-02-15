import React from "react";
import Logo from "../assets/images/forest_logo.png";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <div id="top-navbar">
      <Link to="/" className="flex items-center">
        <img
          src={Logo}
          alt="forest_logo"
          className="w-[187px] h-[30px] ml-[24px] cursor-pointer mt-4 mb-3"
        />
      </Link>
      <div className="flex justify-center items-center">
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
