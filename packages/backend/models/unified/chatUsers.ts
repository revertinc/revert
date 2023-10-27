export interface UnifiedDiscordUser {
    id: string;
    name: string;
    createdTimeStamp: string;
    additional: any;
}

export function unifyDiscordUser(user: any): UnifiedDiscordUser {
    const unifiedUser: UnifiedDiscordUser = {
        id: user.id,
        name: user.real_name,
        createdTimeStamp: new Date(user.updated * 1000).toISOString(),
        additional: {},
    };

    // Map additional fields
    Object.keys(user).forEach((key) => {
        if (!(key in unifiedUser)) {
            unifiedUser['additional'][key] = user[key];
        }
    });

    return unifiedUser;
}