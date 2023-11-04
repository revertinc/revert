import { TP_ID } from '@prisma/client';
import { UsersService } from '../../generated/typescript/api/resources/chat/resources/users/service/UsersService';
// import { InternalServerError } from '../../generated/typescript/api/resources/common';
import { InternalServerError } from '../../generated/typescript/api/resources/common/resources';
import { isStandardError } from '../../helpers/error';
import { logError, logInfo } from '../../helpers/logger';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import axios from 'axios';
import { unifyChatUser } from '../../models/unified/chatUsers';
import revertAuthMiddleware from '../../helpers/authMiddleware';
import config from '../../config';
const usersService = new UsersService(
    {
        async getUsers(req: any, res: any) {
            try {
                console.log(req)
                const connection = res.locals.connection;

                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;

                logInfo(
                    'Revert::GET ALL USERS',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken
                );

                switch (thirdPartyId) {
                    case TP_ID.slack: {
                        const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&after=${cursor}` : ''
                        }`;

                        const url = `https://slack.com/api/users.list?${pagingString}`;

                        let users: any = await axios({
                            method: 'get',
                            url: `https://discord.com/api/guilds/${thirdPartyToken}/members`,
                            headers: {
                                Authorization: `Bot ${config.DISCORD_BOT_TOKEN}`,
                            },
                        });
                        const nextCursor = users.data?.response_metadata?.next_cursor || undefined;

                        users = users.data.members;
                        users = users?.map((l: any) => unifyChatUser(l));

                        res.send({ status: 'ok', next: nextCursor, results: users });

                        break;
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch users', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { usersService };
