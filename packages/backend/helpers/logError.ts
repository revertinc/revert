import * as Sentry from '@sentry/node';

const logError = (error: Error) => {
    console.error('error', error);
    Sentry.captureException(error);
};

export default logError;
