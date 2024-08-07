import config from '../../config';

// Warn: svixAppId is now including env that is environmentId -> ie: accoundId_environment (accountId_production)
export default async function sendConnectionAddedEvent(
    svixAppId: string,
    tenantId: string,
    tp_id: string,
    tp_access_token: string,
    tp_customer_id: string,
) {
    try {
        const isSvixAppExist = await getSvixAccount(svixAppId);
        if (!isSvixAppExist) {
            return;
        }

        config.svix?.message.create(svixAppId, {
            eventType: 'connection.added',
            payload: {
                eventType: 'connection.added',
                connection: {
                    t_id: tenantId,
                    tp_id: tp_id,
                    tp_access_token: tp_access_token,
                    tp_customer_id: tp_customer_id,
                },
            },
            channels: [tenantId],
        });
    } catch (error) {
        console.error('Error sending webhook event:', error);
    }
}

export async function sendConnectionDeletedEvent(svixAppId: string, connection: any) {
    try {
        const isSvixAppExist = await getSvixAccount(svixAppId);
        if (!isSvixAppExist) {
            return;
        }
        config.svix?.message.create(svixAppId, {
            eventType: 'connection.deleted',
            payload: {
                eventType: 'connection.deleted',
                connection,
            },
            channels: [connection.t_id],
        });
    } catch (error) {
        console.error('Error sending webhook event:', error);
    }
}

export async function getSvixAccount(svixAppId: string) {
    try {
        const svixAccount = await config.svix?.application.get(svixAppId);
        return svixAccount;
    } catch (error) {
        // probably svixAccount doesn't exist
        return undefined;
    }
}
