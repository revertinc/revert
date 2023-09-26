import axios from 'axios';
import { TP_ID } from '@prisma/client';
import { ProxyService } from '../../generated/typescript/api/resources/crm/resources/proxy/service/ProxyService';
import { NotFoundError } from '../../generated/typescript/api/resources/common';
import revertAuthMiddleware from '../../helpers/authMiddleware';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import { logInfo } from '../../helpers/logger';

const proxyService = new ProxyService(
    {
        async tunnel(req, res) {
            const connection = res.locals.connection;
            const thirdPartyId = connection.tp_id;
            const thirdPartyToken = connection.tp_access_token;
            const tenantId = connection.t_id;
            const request = req.body;
            const path = request.path;
            const body = request.body;
            const method = request.method;
            const queryParams = request.queryParams;

            logInfo('Revert::POST PROXY', connection.app?.env?.accountId, tenantId, thirdPartyId, thirdPartyToken);
            if (thirdPartyId === TP_ID.hubspot) {
                const result = await axios({
                    method: method,
                    url: `https://api.hubapi.com/${path}`,
                    headers: {
                        authorization: `Bearer ${thirdPartyToken}`,
                        'Content-Type': 'application/json',
                    },
                    data: JSON.stringify(body),
                    params: queryParams,
                });

                res.send({
                    result: result.data,
                });
            } else if (thirdPartyId === TP_ID.zohocrm) {
                const result = await axios({
                    method: method,
                    url: `https://www.zohoapis.com/${path}`,
                    headers: {
                        'Content-Type': 'application/json',
                        authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                    },
                    data: JSON.stringify(body),
                    params: queryParams,
                });
                res.send({ result: result.data.data });
            } else if (thirdPartyId === TP_ID.sfdc || thirdPartyId === TP_ID.pipedrive) {
                const instanceUrl = connection.tp_account_url;
                const result = await axios({
                    method: method,
                    url: `${instanceUrl}/${path}`,
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${thirdPartyToken}`,
                    },
                    data: JSON.stringify(body),
                    params: queryParams,
                });
                res.send({ result: result.data });
            } else {
                throw new NotFoundError({ error: 'Unrecognized CRM!' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { proxyService };
