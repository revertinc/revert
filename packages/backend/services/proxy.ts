import axios from 'axios';
import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

class ProxyService {
    async tunnel(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const contactId = req.params.id;
        const request = req.body;
        const path = request.path;
        const body = request.body;
        const method = request.method;
        const queryParams = request.queryParams;

        console.log('Revert::POST PROXY', tenantId, thirdPartyId, thirdPartyToken, contactId);
        if (thirdPartyId === 'hubspot') {
            const result = await axios({
                method: method,
                url: `https://api.hubapi.com/${path}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(body),
                params: queryParams,
            });

            return {
                result: result.data,
            };
        } else if (thirdPartyId === 'zohocrm') {
            const result = await axios({
                method: method,
                url: `https://www.zohoapis.com/${path}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(body),
                params: queryParams,
            });
            return { result: result.data.data };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            const result = await axios({
                method: method,
                url: `${instanceUrl}/${path}`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(body),
                params: queryParams,
            });
            return { result: result.data };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
}
export default new ProxyService();
