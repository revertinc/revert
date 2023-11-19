export interface UnifiedChannel {
    id: string;
    name: string;
    createdTimeStamp?: string | null;
    additional: any;
}

export function unifyChannel(channel: any) {
    console.log(channel.created, 'qqqqqqqqqqqqqq');
    var createdTimeStamp;
    if (channel.created == undefined) {
        createdTimeStamp = null;
    } else {
        createdTimeStamp = new Date(channel.created * 1000).toISOString();
    }
    const unifiedChannel: UnifiedChannel = {
        id: channel.id,
        name: channel.name_normalized,
        createdTimeStamp: createdTimeStamp,
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
