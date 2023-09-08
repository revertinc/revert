import { Route, Routes, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import React from 'react';
import { SignedIn, SignedOut, SignUp, ClerkProvider, SignIn, RedirectToSignIn } from '@clerk/clerk-react';
import { OAuthCallback } from '../common/oauth';
import Home from '../home/index';

export function RouterComponent() {
    const navigate = useNavigate();
    const publicKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY!;
    return (
        <ClerkProvider publishableKey={publicKey} navigate={(to) => navigate(to)}>
            <Toaster position="bottom-right" reverseOrder={false} />
            <Routes>
                <Route
                    path="/"
                    element={
                        <>
                            <SignedOut>
                                <div className="flex items-center justify-center h-[100%]">
                                    <SignIn
                                        afterSignUpUrl={'/'}
                                        appearance={{
                                            variables: {
                                                colorPrimary: '#343232',
                                            },
                                            elements: {
                                                formButtonPrimary: 'bg-[#343232]',
                                            },
                                        }}
                                        signUpUrl="/sign-up"
                                    />
                                </div>
                            </SignedOut>
                            <SignedIn>
                                <Home />
                            </SignedIn>
                        </>
                    }
                />
                <Route
                    path="/sign-up"
                    element={
                        <div className="flex items-center justify-center h-[100%]">
                            <SignUp
                                afterSignUpUrl={'/'}
                                appearance={{
                                    variables: {
                                        colorPrimary: '#343232',
                                    },
                                    elements: {
                                        formButtonPrimary: 'bg-[#343232]',
                                    },
                                }}
                            />
                        </div>
                    }
                />
                <Route
                    path="/oauth-callback/:integrationId"
                    element={
                        <div className="mt-10">
                            <OAuthCallback />
                        </div>
                    }
                />
                <Route
                    path="/sign-in"
                    element={
                        <>
                            <div className="flex items-center justify-center h-[100%]">
                                <SignIn
                                    redirectUrl={'/'}
                                    afterSignInUrl={'/'}
                                    appearance={{
                                        variables: {
                                            colorPrimary: '#343232',
                                        },
                                        elements: {
                                            formButtonPrimary: 'bg-[#343232]',
                                        },
                                    }}
                                    signUpUrl="/sign-up"
                                />
                            </div>
                        </>
                    }
                />
            </Routes>{' '}
        </ClerkProvider>
    );
}
