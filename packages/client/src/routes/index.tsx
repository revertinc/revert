import { Route, Routes } from 'react-router-dom';
import React from 'react';

import { OAuthCallback } from '../common/oauth';

export function RouterComponent() {
    return (
        <Routes>
            <Route
                path="/oauth-callback/:integrationId"
                element={
                    <div className="mt-10">
                        <OAuthCallback />
                    </div>
                }
            />
            <Route
                path="/oauth-callback"
                element={
                    <div className="mt-10">
                        <OAuthCallback />
                    </div>
                }
            />
        </Routes>
    );
}
