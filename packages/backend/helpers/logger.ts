import * as Sentry from '@sentry/node';
import winston from 'winston';

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
import winston from 'winston';

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

const logError = (error: Error) => {
    Sentry.captureException(error);
    logger.error(error);
};

const logInfo = (message: string, ...args: any[]) => {
    if (!args || !args.length) {
        logger.info(message);
        return;
    }
    logger.info(`${message} %o`, args);
};

const logDebug = (message: string, arg: any) => {
    if (!arg) {
        logger.debug(message);
        return;
    }
    if (typeof arg !== 'object') {
        logger.debug(message, arg);
        return;
    }
    logger.debug(`${message} %o`, arg);
};

export { logError, logInfo, logDebug, logWarn };

export default logger;
