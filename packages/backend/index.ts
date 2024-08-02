import express, { Express, Request, Response } from 'express';
// Note: Sentry should be initialized as early in your app as possible.
import * as Sentry from '@sentry/node';
import moesif from 'moesif-nodejs';
import config from './config';
import indexRouter from './routes/index';
import cors from 'cors';
import cron from 'node-cron';
import morgan from 'morgan';
import os from 'os';
import AuthService from './services/auth';
import MetricsService from './services/metrics';

import versionMiddleware, { manageRouterVersioning } from './helpers/versionMiddleware';
import { ShortloopSDK } from '@shortloop/node';
import endpointLogger from './helpers/endPointLoggerMiddleWare';

const app: Express = express();

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

// add morgan route logging
morgan.token('tenant-id', (req: any) => {
    return req.headers['x-revert-t-id'];
});
morgan.token('account-id', (_req, res: any) => {
    return res.locals?.account?.id;
});

morgan.token('hostname', function getHostname() {
    return os.hostname();
});

const jsonFormat = (tokens: any, req: any, res: any) => {
    return JSON.stringify({
        tenant: tokens['tenant-id'](req, res),
        account: tokens['account-id'](req, res),
        'remote-address': tokens['remote-addr'](req, res),
        time: tokens['date'](req, res, 'iso'),
        method: tokens['method'](req, res),
        url: tokens['url'](req, res),
        'http-version': tokens['http-version'](req, res),
        status: tokens['status'](req, res),
        'content-length': tokens['res'](req, res, 'content-length'),
        referrer: tokens['referrer'](req, res),
        'user-agent': tokens['user-agent'](req, res),
        hostname: tokens['hostname'](req, res),
        'response-time': `${tokens['response-time'](req, res)}`, // in milliseconds
    });
};

app.use(
    morgan(jsonFormat, {
        skip: (req, _) => {
            return req.originalUrl.startsWith('/health-check');
        },
    })
);

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

if (config.MOESIF_APPLICATION_ID) {
    // Set the options, the only required field is applicationId
    const moesifMiddleware = moesif({
        applicationId: config.MOESIF_APPLICATION_ID!,
        debug: process.env.NODE_ENV !== 'production', // enable debug mode.
        logBody: true,
        // Optional hook to link API calls to users
        identifyUser: function (req: any, _: any) {
            return req.headers['x-revert-t-id'] ? req.headers['x-revert-t-id'] : undefined;
        },
        identifyCompany: function (_: any, res: any) {
            return res.locals?.account?.id;
        },
    });
    app.use(moesifMiddleware);
}

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
app.use(endpointLogger());
// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use((_err: any, _req: any, res: any, _next: any) => {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    if (!res.headersSent) {
        res.statusCode = 500;
        res.end(res.sentry + '\n');
    }
});

app.listen(config.PORT, () => {
    console.log(`⚡️[server]: Revert server is running at http://localhost:${config.PORT}`);
    // Refresh tokens on a schedule.
    // TODO: do this optimistically.
    cron.schedule(`*/2 * * * *`, async () => {
        await AuthService.refreshOAuthTokensForThirdParty();
        await AuthService.refreshOAuthTokensForThirdPartyChatServices();
        await AuthService.refreshOAuthTokensForThirdPartyTicketServices();

        await AuthService.refreshOAuthTokensForThirdPartyAccountingServices();

        await AuthService.refreshOAuthTokensForThirdPartyAtsServices();
    });
    if (!config.DISABLE_REVERT_TELEMETRY) {
        cron.schedule(`*/30 * * * *`, async () => {
            await MetricsService.collectAndPublishMetrics();
        });
    }
}).setTimeout(600000);
