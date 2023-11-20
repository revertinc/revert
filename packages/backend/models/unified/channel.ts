export interface UnifiedChannel {
    id: string;
    name: string;
    createdTimeStamp?: string | null;
    additional: any;
}
function channelList(unifiedChannel: UnifiedChannel, channel: any) {
    Object.keys(channel).forEach((key) => {
        if (!(key in unifiedChannel)) {
            unifiedChannel['additional'][key] = channel[key];
        }
    });
    return unifiedChannel;
}
export function unifyChannel(channel: any) {
    if (channel.created == undefined) {
        const unifiedChannel: UnifiedChannel = {
            id: channel.id,
            name: channel.name_normalized,
            additional: {},
        };
        return channelList(unifiedChannel, channel);
    } else {
        const unifiedChannel: UnifiedChannel = {
            id: channel.id,
            name: channel.name_normalized,
            createdTimeStamp: new Date(channel.created * 1000).toISOString(),
            additional: {},
        };

        return channelList(unifiedChannel, channel);
    }
}
