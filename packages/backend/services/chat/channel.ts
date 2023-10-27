import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';

import logError from '../../helpers/logger';
// import { ServersService } from '../../generated/typescript/api/resources/discord/resources/servers/service/ServersService';
import { ChannelsService } from '../../generated/typescript/api/resources/chat/resources/channels/service/ChannelsService';
import { isStandardError } from '../../helpers/error';
// import { InternalServerError } from '../../generated/typescript/api/resources/common';
import { TP_ID } from '@prisma/client';
import axios from 'axios';
// import { unifyChannel } from '../../models/unified/channel';
import { unifyServer } from '../../models/unified/channel';
import revertAuthMiddleware from '../../helpers/authMiddleware';
import config from 'config';
const channelService = new ChannelsService(
    {
        async getChannels(req : any, res : any) {
            console.log(req.query);
            try {
                console.log(
                    res.locals.connection,
                    '00000000000000000000000000000000000000000000000---------------------------------llllllllllllllll'
                );
                const connection = res.locals.connection;
                // const pageSize = parseInt(String(req.query.pageSize));
                // const cursor = req.query.cursor;

           
                const thirdPartyId = connection.tp_id;
                // const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const customorId = connection.tp_customer_id;
                console.log('Revert::GET CHANNELS', tenantId, thirdPartyId);

                switch (thirdPartyId) {
                    case TP_ID.discord: {
                        // const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                        //     cursor ? `&after=${cursor}` : ''
                        // }`;

                        const url = `https://discord.com/api/guilds/${customorId}/channels`;

                        let channels: any = await axios({
                            method: 'get',
                            url: url,
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                Authorization: `Bot ${config.DISCORD_BOT_TOKEN}`,
                            },
                        });

                        // const nextCursor = channels.data?.response_metadata?.next_cursor || undefined;
                       
                        channels = channels.data;
                      
                        channels = channels.map((l: any) => unifyServer(l));
                        console.log(channels, 'ppppppppppppp');
                        res.send({ status: 'ok', results: channels });
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
