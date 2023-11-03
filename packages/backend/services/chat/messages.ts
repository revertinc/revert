// import logError from '../../helpers/logError';
import logError from '../../helpers/logger';
// import { MessagesService } from '../../generated/typescript/api/resources/discord/resources/messages/service/MessagesService';
// import { MessagesService } from '../../generated/typescript/api/resources/chat/resources/messages/service/MessagesService';
import { MessagesService } from '../../generated/typescript/api/resources/chat/resources/messages/service/MessagesService';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { UnifiedMessage,disunifyMessage,unifyMessage } from '../../models/unified/messages';
// import { UnifiedMessage, disunifyMessage, unifyMessage } from '../../models/unified/message';
import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { isStandardError } from '../../helpers/error';
import config from '../../config'
import revertAuthMiddleware from '../../helpers/authMiddleware';

const messageService = new MessagesService(
    {
        async createMessage(req, res) {
            try {
                const messageData = req.body as UnifiedMessage;
                const connection = res.locals.connection;
                const thirdPartyId = connection.tp_id;
                const tenantId = connection.t_id;
                const message = disunifyMessage(messageData, thirdPartyId);
                console.log('Revert::CREATE MESSAGE', tenantId, message, thirdPartyId);
                

                switch (thirdPartyId) {
                    case TP_ID.discord: {
                        console.log(thirdPartyId,"third")
                        let disocrdRes: any = await axios({
                            method: 'post',
                            url: `https://discord.com/api/channels/${message.channel}/messages`,
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bot ${config.DISCORD_BOT_TOKEN}`,
                            },
                            data: JSON.stringify(message),
                        });
                       
                        console.log(disocrdRes);
                        disocrdRes = unifyMessage(disocrdRes.data);
                        res.send({
                            status: 'ok',
                            result: disocrdRes,
                        });
                        break;
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not create contact', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new error({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { messageService };