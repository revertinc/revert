import * as Sentry from '@sentry/node';
import winston from 'winston';

const logError = (error: Error) => {
    console.error('error', error);
    Sentry.captureException(error);
};

const logInfo = (...args: any[]) => {
    // TODO: replace with winston or something else very soon.
    console.log(...args);
};
export { logError, logInfo };

const enumerateErrorFormat = winston.format((info) => {
    if (info instanceof Error) {
        Object.assign(info, { message: info.stack });
    }
    return info;
});

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        enumerateErrorFormat(),
        process.env.NODE_ENV === 'development' ? winston.format.colorize() : winston.format.uncolorize(),
        winston.format.splat(),
        winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`)
    ),
    transports: [
        new winston.transports.Console({
            stderrLevels: ['error'],
        }),
    ],
});

export default logger;
