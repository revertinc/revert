import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';
import * as Sentry from '@sentry/react';

Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    integrations: [
        new Sentry.BrowserTracing({
            // See docs for support of different versions of variation of react router
            // https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/react-router/
            routingInstrumentation: Sentry.reactRouterV6Instrumentation(
                React.useEffect,
                useLocation,
                useNavigationType,
                createRoutesFromChildren,
                matchRoutes
            ),
        }),
        new Sentry.Replay(),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    tracesSampleRate: 1.0,

    // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
    // tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    enabled: process.env.NODE_ENV !== 'development',
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
});

const root = ReactDOM.createRoot(document!.getElementById('root')!);
root.render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
