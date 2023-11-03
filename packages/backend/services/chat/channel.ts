import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';

import logError from '../../helpers/logger';
import { ChannelsService } from '../../generated/typescript/api/resources/chat/resources/channels/service/ChannelsService';
import { isStandardError } from '../../helpers/error';

import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { unifyServer } from '../../models/unified/channel';
import revertAuthMiddleware from '../../helpers/authMiddleware';
import config from '../../config'
const channelService = new ChannelsService(
    {
        async getChannels(req : any, res : any) {
            console.log(req.query);
            try {
                
                const connection = res.locals.connection;
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;

           
                const thirdPartyId = connection.tp_id;
              
                const customorId = connection.tp_customer_id;
               
                switch (thirdPartyId) {
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
                                Authorization: `Bot ${config.DISCORD_BOT_TOKEN}`,
                            },
                        });

                        const nextCursor = channels.data?.response_metadata?.next_cursor || undefined;
                       
                        channels = channels.data;
                      
                        channels = channels.map((l: any) => unifyServer(l));
                       
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
                throw new error({ error: 'Internal server' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { channelService };
