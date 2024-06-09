import { Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import React from 'react';
import { SignedIn, SignedOut, SignUp, ClerkProvider, SignIn } from '@clerk/clerk-react';
import { OAuthCallback } from '../common/oauth';
import AppLayout from '../layout/AppLayout';
import Onboarding from '../features/home/Onboarding';
import Integrations from '../features/integration/Integrations';
import Analytics from '../features/analytics/Analytics';
import ApiKeys from '../features/environment/ApiKeys';
import Webhook from '../features/webhooks/Webhook';

export function RouterComponent() {
    const navigate = useNavigate();
    const publicKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY!;
    return (
        <ClerkProvider publishableKey={publicKey} navigate={(to) => navigate(to)}>
            <Toaster position="bottom-right" reverseOrder={false} />
            <Routes>
                <Route
                    element={
                        <>
                            <SignedOut>
                                <div className="flex items-center justify-center h-[100%]">
                                    <SignIn
                                        afterSignUpUrl={'/home'}
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
                                <AppLayout />
                            </SignedIn>
                        </>
                    }
                >
                    <Route index element={<Navigate replace to="home" />} />
                    <Route path="home" element={<Onboarding />} />
                    <Route path="apps" element={<Integrations />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="environment" element={<ApiKeys />} />
                    <Route path="webhooks" element={<Webhook />} />
                </Route>
                <Route
                    path="/sign-up"
                    element={
                        <div className="flex items-center justify-center h-[100%]">
                            <SignUp
                                afterSignUpUrl={'/home'}
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
                <Route path="/oauth-callback/:integrationId" element={<OAuthCallback />} />
                <Route
                    path="/sign-in"
                    element={
                        <>
                            <div className="flex items-center justify-center h-[100%]">
                                <SignIn
                                    redirectUrl={'/home'}
                                    afterSignInUrl={'/home'}
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
                <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
        </ClerkProvider>
    );
}
