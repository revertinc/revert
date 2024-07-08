import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { inter } from '@revertdotdev/fonts';
import { cn } from '@revertdotdev/utils';

export const metadata: Metadata = {
    title: {
        template: 'Revert | %s',
        default: 'Revert',
    },
    description: 'Ship Integrations your customers need, 10x faster',
};
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <ClerkProvider>
                <body
                    className={cn(
                        inter.className,
                        'bg-primary-950 min-h-screen antialiased text-slate-50 flex flex-col'
                    )}
                >
                    <SignedOut>
                        <SignInButton />
                    </SignedOut>
                    <SignedIn>{children}</SignedIn>
                </body>
            </ClerkProvider>
        </html>
    );
}
