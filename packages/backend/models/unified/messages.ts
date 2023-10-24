import { TP_ID } from '@prisma/client';

export interface UnifiedMessage {
    content: string;
    channelId: string;
    additional?: any;
}

export function unifyMessage(message: any) {
   const unifiedMessage: UnifiedMessage = {
        content: message.content,
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
    if (integrationId === TP_ID.discord) {
        return todiscordMessage(message);
    }
}

function todiscordMessage(message: UnifiedMessage): any {
    const discordMessage: any = {
        channel: message.channelId,
        content: message.content,
    };

    // Map custom fields, if any
    if (message.additional) {
        Object.keys(message.additional).forEach((key) => {
            discordMessage[key] = message.additional?.[key];
        });
    }

    return discordMessage;
}