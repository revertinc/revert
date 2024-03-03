import { logError } from '../logger';
import pubsub, { IntegrationStatusSseMessage, PUBSUB_CHANNELS } from '../../redis/client/pubsub';
import { Prisma } from '../../prisma/client';
import { Response } from 'express';

type IntegrationCreationOutcome = {
    status: boolean;
    revertPublicKey: string;
    integrationName?: string;
    tenantSecretToken: string;
    tenantId: string;
    error?: any;
    response: Response;
    tpCustomerId?: string;
    statusText?: string;
};

/**
 * Handles the outcome of an integration creation process.
 * This function is responsible for logging errors and info messages,
 * and sending an API response based on the outcome.
 * @param {IntegrationCreationOutcome} props - An object containing the outcome of the integration creation process.
 * @param {boolean} props.status - The status of the integration creation process.
 * @param {string} props.revertPublicKey - The public key for revert.
 * @param {string} props.integrationName - The name of the integration.
 * @param {string} props.tenantSecretToken - The secret token associated with the tenant.
 * @param {Response} props.response - Express response object.
 * @param {string} props.tenantId - The ID of the tenant.
 * @param {any} props.error - Any error object if an error occurred during the integration creation process.
 * @param {string} props.tpCustomerId - The customer ID associated with the third-party integration.
 *
 */
const processOAuthResult = async ({
    error,
    revertPublicKey,
    integrationName,
    tenantSecretToken,
    response,
    tenantId,
    status,
    tpCustomerId,
    statusText,
}: IntegrationCreationOutcome) => {
    error && logError(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (error?.code === 'P2002') {
            console.error('There is a unique constraint violation, a new user cannot be created with this email');
        }
    }

    await pubsub.publish(`${PUBSUB_CHANNELS.INTEGRATION_STATUS}_${tenantId}`, {
        publicToken: revertPublicKey,
        status: status ? 'SUCCESS' : 'FAILED',
        integrationName,
        tenantId,
        tenantSecretToken,
    } as IntegrationStatusSseMessage);

    return response.send({
        status: status ? 'ok' : 'error',
        statusText,
        ...(error ? { error: error } : {}),
        ...(tpCustomerId ? { tp_customer_id: tpCustomerId } : {}),
    });
};

export default processOAuthResult;
