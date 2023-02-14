import express, { Express } from 'express';
import config from './config';
import mongoose from 'mongoose';
import indexRouter, {
    workflowRouter,
    cronRouter,
    authRouter,
    integrationsRouter,
    nodeRouter,
    crmRouter,
    metadataRouter,
} from './routes/index';
import revertAuthMiddleware from './helpers/authMiddleware';
import cors from 'cors';

const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/', indexRouter);
app.use('/workflow', workflowRouter);
app.use('/cron', cronRouter);
app.use('/auth', authRouter);
app.use('/external', integrationsRouter);
app.use('/node', nodeRouter);
app.use('/v1/crm', cors(), revertAuthMiddleware(), crmRouter);
app.use('/v1/metadata', cors(), revertAuthMiddleware(), metadataRouter);
// Create a MongoDB connection pool and start the application
// after the database connection is ready
mongoose.connect(config.MONGO_URL, (err) => {
    if (err) {
        console.warn(`Failed to connect to the database. ${err.stack}`);
    }
    app.listen(config.PORT, () => {
        console.log(`⚡️[server]: Forest server is running at https://localhost:${config.PORT}`);
    }).setTimeout(600000);
});
