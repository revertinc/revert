import { TP_ID } from '@prisma/client';

export interface UnifiedTicketUser {
    id: string;
    email: string;
    name: string;
    isActive: string;
    avatar: string[] | null;
    createdTimeStamp: string | null;
    updatedTimeStamp: string | null;
    isAdmin: boolean | null;
    additional: any;
}

export function unifyTicketUser(user: any, thirdPartyId: any): UnifiedTicketUser {
    switch (thirdPartyId) {
        case TP_ID.linear: {
            const unifiedUser: UnifiedTicketUser = {
                id: String(user.id),
                email: user.email,
                name: user.name,
                isActive: user.active,
                avatar: user.avatarUrl ? [user.avatarUrl] : null,
                createdTimeStamp: user.createdAt,
                updatedTimeStamp: null,
                isAdmin: user.admin,
                additional: user,
            };
            return unifiedUser;
        }
        // case TP_ID.clickup: {
        //     break;
        // }
        case TP_ID.jira: {
            const unifiedUser: UnifiedTicketUser = {
                id: String(user.accountId),
                email: user.emailAddress || null,
                name: user.displayName,
                isActive: user.active,
                avatar: user.avatarUrls ? Object.values(user.avatarUrls) : null,
                createdTimeStamp: null,
                updatedTimeStamp: null,
                isAdmin: null,
                additional: user,
            };
            return unifiedUser;
        }
        default: {
            throw new Error('Ticketing app not found');
        }
    }
}
