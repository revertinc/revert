import React, { ReactNode } from 'react';

function Main({ children }: { children: ReactNode }) {
    return <div className="flex h-[100%] bg-[#181d28] text-[#fff]">{children}</div>;
}

export default Main;
