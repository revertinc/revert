export interface UnifiedChannel {
    id: string;
    name: string;
    createdTimeStamp: string;
    additional: any;
}

export function unifyChannel(channel: any) {
    const unifiedChannel: UnifiedChannel = {
        id: channel.id,
        name: channel.name_normalized,
        createdTimeStamp: new Date(channel.created * 1000).toISOString(),
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
