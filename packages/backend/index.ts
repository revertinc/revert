import express, { Express } from 'express';
import config from './config';
import indexRouter, { crmRouter } from './routes/index';
import revertAuthMiddleware from './helpers/authMiddleware';
import cors from 'cors';
import cron from 'node-cron';
import AuthService from './services/auth';
import { register } from './generated/typescript';
import { metadataService } from './services/metadata';
import { connectionRouter } from './routes/connection';

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60, // Limit each IP to 60 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: async () => {
        return JSON.stringify({ message: 'Rate limit reached.' });
    },
});

const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(limiter);
app.use('/', indexRouter);
app.use('/v1/crm', cors(), revertAuthMiddleware(), crmRouter);
app.use('/v1/connection', cors(), revertAuthMiddleware(), connectionRouter);
register(app, { metadata: metadataService });

app.listen(config.PORT, () => {
    console.log(`⚡️[server]: Revert server is running at http://localhost:${config.PORT}`);
    // Refresh tokens on a schedule.
    // TODO: do this optimistically.
    cron.schedule(`*/2 * * * *`, async () => {
        await AuthService.refreshOAuthTokensForThirdParty();
    });
}).setTimeout(600000);
