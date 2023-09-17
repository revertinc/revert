import express, { Express, Request, Response } from 'express';
// Note: Sentry should be initialized as early in your app as possible.
import * as Sentry from '@sentry/node';
import config from './config';
import indexRouter from './routes/index';
import cors from 'cors';
import cron from 'node-cron';
import AuthService from './services/auth';
import versionMiddleware, { manageRouterVersioning } from './helpers/versionMiddleware';
import { ShortloopSDK } from '@shortloop/node';
import https from 'node:https';
import fs from 'node:fs';

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60, // Limit each IP to 60 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: async () => {
        return JSON.stringify({ message: 'Rate limit reached.' });
    },
    skip: (req: Request, _res: Response) => {
        const basePath = req.baseUrl + req.path;
        const allowedRoutes = ['/health-check'];
        if (allowedRoutes.includes(basePath)) {
            return true;
        }
        return false;
    },
});

const app: Express = express();

// Debug rate limiting / trust proxy issue as per: https://github.com/express-rate-limit/express-rate-limit/wiki/Troubleshooting-Proxy-Issues
app.set('trust proxy', 1);
app.get('/ip', (request, response) => response.send(request.ip));
app.get('/x-forwarded-for', (request, response) => response.send(request.headers['x-forwarded-for']));

Sentry.init({
    dsn: config.SENTRY_DSN,
    integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app }),
        // Automatically instrument Node.js libraries and frameworks
        ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV !== 'development',
});

// RequestHandler creates a separate execution context, so that all
// transactions/spans/breadcrumbs are isolated across requests
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(limiter);
app.use(versionMiddleware());

ShortloopSDK.init({
    url: 'https://revert.shortloop.dev', // ShortLoop URL. (Provided by ShortLoop team.)
    applicationName: 'revert-api', // your application name here
    authKey: config.SHORTLOOP_AUTH_KEY, // ShortLoop Auth Key. (Provided by ShortLoop team.)
    environment: process.env.NODE_ENV || 'staging', // for e.g stage or prod
    maskHeaders: ['x-revert-t-id', 'x-revert-api-token'],
});
app.use(ShortloopSDK.capture());

// TODO: Just to test versions. Remove later
const testv2Router = (_req: Request, res: Response) => {
    res.send({ data: 'v2 hit' });
};

app.use(
    '/',
    manageRouterVersioning({
        v1: indexRouter,
        v2: testv2Router,
    })
);
app.use(
    '/v1',
    manageRouterVersioning({
        v1: indexRouter,
        v2: testv2Router,
    })
);

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use((_err: any, _req: any, res: any, _next: any) => {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + '\n');
});

// app.listen(config.PORT, () => {
//     console.log(`⚡️[server]: Revert server is running at http://localhost:${config.PORT}`);
//     // Refresh tokens on a schedule.
//     // TODO: do this optimistically.
//     cron.schedule(`*/2 * * * *`, async () => {
//         await AuthService.refreshOAuthTokensForThirdParty();
//     });
// }).setTimeout(600000);

const credentials = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
};

https
    .createServer(credentials, app)
    .listen(config.PORT, () => {
        console.log(`⚡️[server]: Revert server is running at http://localhost:${config.PORT}`);
        // Refresh tokens on a schedule.
        // TODO: do this optimistically.
        cron.schedule(`*/2 * * * *`, async () => {
            await AuthService.refreshOAuthTokensForThirdParty();
        });
    })
    .setTimeout(600000);
