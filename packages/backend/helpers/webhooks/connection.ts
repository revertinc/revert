import config from '../../config';

export default function sendConnectionAddedEvent(
    svixAppId: string,
    tenantId: string,
    tp_id: string,
    tp_access_token: string,
    tp_customer_id: string
) {
    try {
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

export function sendConnectionDeletedEvent(svixAppId: string, connection: any) {
    try {
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
