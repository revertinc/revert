import { Metadata } from 'next';
import '../../globals.css';

export const metadata: Metadata = {
    title: 'Revert | Onboarding',
};

export default function OnBoardingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <div>{children}</div>;
}
