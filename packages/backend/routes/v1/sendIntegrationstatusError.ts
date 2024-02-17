import { logError, logInfo } from '../../helpers/logger';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../redis/client/pubsub';
import { Response } from 'express';

type IntegrationErrorStatusProps = {
    error?: any;
    revertPublicKey: string;
    integrationName?: string;
    tenantSecretToken: string;
    response: Response;
    tenantId: string;
    infoMessage?: string;
    errorStatusText?: string;
};

const sendIntegrationStatusError = async ({
    error,
    revertPublicKey,
    integrationName,
    tenantSecretToken,
    response,
    tenantId,
    infoMessage,
    errorStatusText,
}: IntegrationErrorStatusProps) => {
    error && logError(error);
    infoMessage && logInfo(infoMessage, error);
    await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${tenantId}`, {
        publicToken: revertPublicKey,
        status: 'FAILED',
        integrationName,
        tenantId,
        tenantSecretToken,
    } as IntegrationStatusSseMessage);
    return response.send({ status: errorStatusText ?? 'error', ...(error ? { error: error } : {}) });
};

export default sendIntegrationStatusError;
