import axios from 'axios';
import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { disunifyUser, unifyUser } from '../models/unified/user';
import { ParsedQs } from 'qs';

class UserService {
    async getUnifiedUser(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const userId = req.params.id;
        const fields = req.query.fields;
        console.log('Revert::GET USER', tenantId, thirdPartyId, thirdPartyToken, userId);
        if (thirdPartyId === 'hubspot') {
            let user: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/settings/v3/users/${userId}?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            user = ([user.data] as any[])?.[0];
            user = unifyUser({ ...user, ...user?.properties });
            return {
                result: { ...user, ...user?.properties },
            };
        } else if (thirdPartyId === 'zohocrm') {
            const users = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/users/${userId}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            let user = unifyUser(users.data.users?.[0]);
            return { result: user };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            const users = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/sobjects/User/${userId}`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            let user = unifyUser(users.data);
            return { result: user };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async getUnifiedUsers(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const fields = req.query.fields;
        console.log('Revert::GET ALL USER', tenantId, thirdPartyId, thirdPartyToken);
        if (thirdPartyId === 'hubspot') {
            let users: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/settings/v3/users?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            users = users.data.results as any[];
            users = users?.map((l: any) => unifyUser({ ...l, ...l?.properties }));
            return {
                results: users,
            };
        } else if (thirdPartyId === 'zohocrm') {
            let users: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/users`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            users = users.data.users;
            users = users?.map((l: any) => unifyUser(l));
            return { results: users };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            // TODO: Handle "ALL" for Hubspot & Zoho
            const query =
                !fields || fields === 'ALL'
                    ? 'SELECT+fields(all)+from+User+limit+200'
                    : `SELECT+${(fields as string).split(',').join('+,+')}+from+User`;
            let users: any = await axios({
                method: 'get',
                url: `${instanceUrl}/services/data/v56.0/query/?q=${query}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            users = users.data?.records;
            users = users?.map((l: any) => unifyUser(l));
            return { results: users };
        } else {
            return { error: 'Unrecognized CRM' };
        }
    }
    async createUser(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const user = disunifyUser(req.body, thirdPartyId);
        console.log('Revert::CREATE USER', tenantId, user);
        if (thirdPartyId === 'hubspot') {
            await axios({
                method: 'post',
                url: `https://api.hubapi.com/settings/v3/users`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(user),
            });
            return {
                status: 'ok',
                message: 'Hubspot user created',
                result: user,
            };
        } else if (thirdPartyId === 'zohocrm') {
            await axios({
                method: 'post',
                url: `https://www.zohoapis.com/crm/v3/users`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
                data: JSON.stringify(user),
            });
            return { status: 'ok', message: 'Zoho user created', result: user };
        } else if (thirdPartyId === 'sfdc') {
            const instanceUrl = connection.tp_account_url;
            const userCreated = await axios({
                method: 'post',
                url: `${instanceUrl}/services/data/v56.0/sobjects/User/`,
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${thirdPartyToken}`,
                },
                data: JSON.stringify(user),
            });
            return {
                status: 'ok',
                message: 'SFDC user created',
                result: userCreated.data,
            };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
}

export default new UserService();
