import { logError, logInfo } from '../../helpers/logger';

import {MessagesService} from '../../generated/typescript/api/resources/chat/resources/messages/service/MessagesService';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { UnifiedMessage, disunifyMessage, unifyMessage } from '../../models/unified/message';
import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { isStandardError } from '../../helpers/error';
import {InternalServerError} from '../../generated/typescript/api/resources/common/resources/errors/errors';
import revertAuthMiddleware from '../../helpers/authMiddleware';

const messageService = new MessagesService(
    {
        async createMessage(req, res) {
            try {
                const messageData = req.body as UnifiedMessage;
                const connection = res.locals.connection;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const botToken = connection.app_bot_token;
                const message = disunifyMessage(messageData, thirdPartyId);
                logInfo(
                    'Revert::CREATE/SEND MESSAGE',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken
                );

                switch (thirdPartyId) {
                    case TP_ID.slack: {
                        let slackRes: any = await axios({
                            method: 'post',
                            url: 'https://slack.com/api/chat.postMessage',
                            headers: {
                                'content-type': 'application/json',
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(message),
                        });
                        slackRes = unifyMessage(slackRes.data);
                        res.send({
                            status: 'ok',
                            result: slackRes,
                        });

                        


                        break;
                    }

                    case TP_ID.discord: {
                        
                        let disocrdRes: any = await axios({
                            method: 'post',
                            url: `https://discord.com/api/channels/${message.channel}/messages`,
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bot ${botToken}`,
                            },
                            data: JSON.stringify(message),
                        });


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
                console.error('Could not create/send message', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { messageService };