import logError from '../../helpers/logError';
import { MessagesService } from '../../generated/typescript/api/resources/chat/resources/messages/service/MessagesService';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { UnifiedMessage, disunifyMessage, unifyMessage } from '../../models/unified/message';
import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { isStandardError } from '../../helpers/error';
import { InternalServerError } from '../../generated/typescript/api/resources/common';
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
                const message = disunifyMessage(messageData, thirdPartyId);
                console.log('Revert::CREATE MESSAGE', tenantId, message, thirdPartyId);

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
                        console.log('Below is slack post response');
                        console.log(slackRes);
                        slackRes = unifyMessage(slackRes.data);
                        res.send({
                            status: 'ok',
                            result: slackRes,
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
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { messageService };
