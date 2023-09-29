export interface UnifiedChatUser {
    id: string;
    name: string;
    createdTimeStamp: string;
    additional: any;
}

export function unifyChatUser(user: any): UnifiedChatUser {
    const unifiedUser: UnifiedChatUser = {
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
