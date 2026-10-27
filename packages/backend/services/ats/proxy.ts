import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';

import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { ProxyService } from '../../generated/typescript/api/resources/ats/resources/proxy/service/ProxyService';
import { parseWorkdayTenantUrl } from '../../helpers/ats/workday';

const proxyServiceAts = new ProxyService(
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
                    'Revert::POST PROXY FOR ATS APP',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                );

                switch (thirdPartyId) {
                    case TP_ID.greenhouse: {
                        const apiToken = thirdPartyToken;
                        const credentials = Buffer.from(apiToken + ':').toString('base64');
                        const headers = {
                            Authorization: 'Basic ' + credentials,
                        };
                        const result: any = await axios({
                            method: method,
                            url: `https://harvest.greenhouse.io/v1/${path}`,
                            headers: headers,
                            data: body,
                            params: queryParams,
                        });
                        res.send({
                            result: result.data,
                        });
                        break;
                    }
                    case TP_ID.lever: {
                        const token = thirdPartyToken;
                        const headers = {
                            Authorization: 'Bearer ' + token,
                        };
                        const result: any = await axios({
                            method: method,
                            url: `https://api.lever.co/v1/${path}`,
                            headers: headers,
                            data: body,
                            params: queryParams,
                        });
                        res.send({
                            result: result.data,
                        });
                        break;
                    }
                    case TP_ID.workday: {
                        // Never forward the bearer token to an arbitrary URL: the
                        // request path is always resolved against the connection's
                        // own Workday tenant origin.
                        const tenant = parseWorkdayTenantUrl(
                            (connection.app?.app_config as any)?.tenantUrl,
                            connection.tp_customer_id || undefined,
                        );
                        const headers = {
                            Authorization: 'Bearer ' + thirdPartyToken,
                        };
                        const result: any = await axios({
                            method: method,
                            url: `${tenant.baseUrl}/${String(path).replace(/^\/+/, '')}`,
                            headers,
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
    [revertAuthMiddleware(), revertTenantMiddleware()],
);

export { proxyServiceAts };
