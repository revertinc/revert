import express, { Express } from 'express';
import config from './config';
import indexRouter, { crmRouter, metadataRouter } from './routes/index';
import revertAuthMiddleware from './helpers/authMiddleware';
import cors from 'cors';
import cron from 'node-cron';
import AuthService from './services/auth';

const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/', indexRouter);
app.use('/v1/crm', cors(), revertAuthMiddleware(), crmRouter);
app.use('/v1/metadata', cors(), metadataRouter);

app.listen(config.PORT, () => {
    console.log(`⚡️[server]: Revert server is running at http://localhost:${config.PORT}`);
    // Refresh tokens on a schedule.
    // TODO: do this optimistically.
    cron.schedule(`*/2 * * * *`, async () => {
        await AuthService.refreshOAuthTokensForThirdParty();
    });
}).setTimeout(600000);
