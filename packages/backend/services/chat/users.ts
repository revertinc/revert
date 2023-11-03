import { TP_ID } from '@prisma/client';
// import { UsersService } from '../../generated/typescript/api/resources/discord/resources/users/service/UsersService';
// import { UserService } from 'generated/typescript/api/resources/chat/resources/user/service/UserService';
import { UsersService } from '../../generated/typescript/api/resources/chat/resources/users/service/UsersService';
// import { InternalServerError } from '../../generated/typescript/api/resources/common';
import { InternalServerError } from '../../generated/typescript/api/resources/common/resources';
import { isStandardError } from '../../helpers/error';
import logError from '../../helpers/logger';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import axios from 'axios';
import { unifyDiscordUser } from '../../models/unified/chatUsers';
import revertAuthMiddleware from '../../helpers/authMiddleware';
import config from '../../config'
const usersService = new UsersService(
    {
        async getUsers(req:any , res : any) {
            try {
                const connection = res.locals.connection;
                const pageSize = parseInt(String(req.query.pageSize));
                // const cursor = req.query.cursor;
               
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_customer_id;
                // const tenantId = connection.t_id;
               

                switch (thirdPartyId) {
                    case TP_ID.discord: {
                        
                        console.log('Revert::GET USERS', connection,pageSize);
                       

                        let users: any = await axios({
                            method: 'get',
                            url: `https://discord.com/api/guilds/${thirdPartyToken}/members`,
                            headers: {
                                Authorization: `Bot ${config.DISCORD_BOT_TOKEN}`,
                            },
                        });
                        const nextCursor = users.data?.response_metadata?.next_cursor || undefined;
                        console.log(users,"pssssss")
                        users = users.data;
                        users = users?.map((l: any) => unifyDiscordUser(l));

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
                throw new InternalServerError({ error: 'Internal server' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { usersService };