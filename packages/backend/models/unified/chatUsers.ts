export interface UnifiedDiscordUser {
    id: string;
    name: string;
    additional: any;
}

export function unifyDiscordUser(user: any): UnifiedDiscordUser {
    const unifiedUser: UnifiedDiscordUser = {
        id: user.id,
        name: user.real_name,
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