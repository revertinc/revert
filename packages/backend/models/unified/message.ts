import { TP_ID } from '@prisma/client';

export interface UnifiedMessage {
    text: string;
    channelId: string;
    additional?: any;
}

export function unifyMessage(message: any) {
    const unifiedMessage: UnifiedMessage = {
        text: message.message.text,
        channelId: message.channel,
        additional: {},
    };

    // Map additional fields
    Object.keys(message).forEach((key) => {
        if (!(key in unifiedMessage)) {
            unifiedMessage['additional'][key] = message[key];
        }
    });

    return unifiedMessage;
}

export function disunifyMessage(message: UnifiedMessage, integrationId: string): any {
    if (integrationId === TP_ID.slack) {
        return toSlackMessage(message);
    }
}

function toSlackMessage(message: UnifiedMessage): any {
    const slackMessage: any = {
        channel: message.channelId,
        text: message.text,
    };

    // Map custom fields, if any
    if (message.additional) {
        Object.keys(message.additional).forEach((key) => {
            slackMessage[key] = message.additional?.[key];
        });
    }

    return slackMessage;
}
