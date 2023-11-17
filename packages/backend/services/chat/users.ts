import { TP_ID } from '@prisma/client';
import {UsersService} from '../../generated/typescript/api/resources/chat/resources/users/service/UsersService';
import {InternalServerError} from '../../generated/typescript/api/resources/common/resources/errors/errors';
import { isStandardError } from '../../helpers/error';
import { logError, logInfo } from '../../helpers/logger';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import axios from 'axios';
import { unifyChatUser } from '../../models/unified/chatUsers';
import revertAuthMiddleware from '../../helpers/authMiddleware';

const usersService = new UsersService(
    {
        async getUsers(req, res) {
            try {
                const connection = res.locals.connection;
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const customorId = connection.tp_customer_id;
                // const botToken = connection.app_bot_token;
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
                            url: url,
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        const nextCursor = users.data?.response_metadata?.next_cursor || undefined;

                        users = users.data.members;
                        users = users?.map((l: any) => unifyChatUser(l));

                        res.send({ status: 'ok', next: nextCursor, results: users });

                        break;
                    }

                    case TP_ID.discord: {
                        const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&after=${cursor}` : ''
                        }`;


                        const url = `https://discord.com/api/guilds/${customorId}/channels?${pagingString}`;

                        let channels: any = await axios({
                            method: 'get',
                            url: url,
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                Authorization: `Bot MTE2Mzc3NjE3OTAwMjY4MzQwMg.GJPLXM.RicdoQAHC5GDBIO0jeVqG1MaibHpxjfA8Nj4w4`,
                            },
                        });

                        const nextCursor = channels.data?.response_metadata?.next_cursor || undefined;

                        channels = channels.data;

                        channels = channels.map((l: any) => unifyChatUser(l));

                        res.send({ status: 'ok',next: nextCursor,results: channels });
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
