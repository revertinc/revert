export interface UnifiedChannel {
    id: string;
    name: string;
    createdTimeStamp: string | null;
    additional: any;
}

export function unifyChannel(channel: any) {
    const unifiedChannel: UnifiedChannel = {
        id: channel.id,
        name: channel.name_normalized || channel.name,
        createdTimeStamp: channel.created ? new Date(channel.created * 1000).toISOString() : null,
        additional: {},
    };

    // Map additional fields
    Object.keys(channel).forEach((key) => {
        if (!(key in unifiedChannel)) {
            unifiedChannel['additional'][key] = channel[key];
        }
    });

    return unifiedChannel;
}
