import { TP_ID } from '@prisma/client';

export interface UnifiedMessage {
    content?: string;
    text?: string;
    channelId: string;
    additional?: any;
}

export function unifyMessage(message: any) {
    console.log(message,"============")
    const unifiedMessage: UnifiedMessage = {
        content: message?.content,
        text: message?.message?.text || null,
        channelId: message.channel,
        additional: {},
    };
    console.log("im not here")
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
    if (integrationId === TP_ID.discord) {
        console.log("first")
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
