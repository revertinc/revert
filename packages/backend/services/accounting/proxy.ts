import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { ProxyService } from '../../generated/typescript/api/resources/accounting/resources/proxy/service/ProxyService';
import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { LinearClient } from '@linear/sdk';

const ProxyServiceAccounting = new ProxyService(
    {
        async tunnel(req, res) {
            try {
                const connection = res.locals.connection;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const request = req.body;
                const path = request.path;
                const body: any = request.body;
                const method = request.method;
                const queryParams = request.queryParams;

                logInfo(
                    'Revert::POST PROXY FOR TICKETING APP',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken
                );

                switch (thirdPartyId) {
                    case TP_ID.linear: {
                        const linear = new LinearClient({
                            accessToken: thirdPartyToken,
                        });

                        const linearGraphqlClient = await linear.client;
                        const result: any = await linearGraphqlClient.request(String(body.query), body.input);

                        res.send({
                            result: result,
                        });
                        break;
                    }
                    case TP_ID.clickup: {
                        const result = await axios({
                            method: method,
                            url: `https://api.clickup.com/api/v2/${path}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'Content-Type': 'application/json',
                            },
                            data: JSON.stringify(body),
                            params: queryParams,
                        });

                        res.send({
                            result: result.data,
                        });
                        break;
                    }
                    case TP_ID.jira: {
                        const result = await axios({
                            method: method,
                            url: `${connection.tp_account_url}/${path}`,
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(body),
                            params: queryParams,
                        });

                        res.send({
                            result: result.data,
                        });
                        break;
                    }
                    case TP_ID.trello: {
                        const result: any = await axios({
                            method: method,
                            url: `https://api.trello.com/1/${path}?key=${connection.app_client_id}&token=${thirdPartyToken}`,
                            headers: {
                                Accept: 'application/json',
                            },
                            data: body,
                            params: queryParams,
                        });
                        res.send({
                            result: result.data,
                        });
                        break;
                    }
                    case TP_ID.bitbucket: {
                        const result: any = await axios({
                            method: method,
                            url: `https://api.bitbucket.org/2.0/${path}`,
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                            data: body,
                            params: queryParams,
                        });
                        res.send({
                            result: result.data,
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized app!' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not do proxy request', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { ProxyServiceAccounting };
