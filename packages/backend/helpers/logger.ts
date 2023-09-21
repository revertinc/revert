import * as Sentry from '@sentry/node';

const logError = (error: Error) => {
    console.error('error', error);
    Sentry.captureException(error);
};

const logInfo = (...args: any[]) => {
    // TODO: replace with winston or something else very soon.
    console.log(...args);
};
export { logError, logInfo };

export default logError;
