import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';

import { TP_ID } from '@prisma/client';
import axios from 'axios';
import { ProxyService } from '../../generated/typescript/api/resources/ats/resources/proxy/service/ProxyService';

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
                    thirdPartyToken
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

export { proxyServiceAts };
