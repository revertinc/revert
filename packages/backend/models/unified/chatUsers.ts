export interface UnifiedChatUser {
    id: string;
    name: string;
    createdTimeStamp: string;
    additional: any;
}

export function unifyChatUser(user: any): UnifiedChatUser {
    console.log('DEBUG', 'user', user);
    const unifiedUser: UnifiedChatUser = {
        id: user.id || user.user.id,
        name: user.profile.real_name || user.user.global_name,
        createdTimeStamp: user.joined_at || new Date(user.updated * 1000).toISOString(),
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
