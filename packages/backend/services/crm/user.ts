import axios from 'axios';

import { UserService } from '../../generated/typescript/api/resources/crm/resources/user/service/UserService';
import { InternalServerError } from '../../generated/typescript/api/resources/common';
import { NotFoundError } from '../../generated/typescript/api/resources/common';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import revertAuthMiddleware from '../../helpers/authMiddleware';
import logError from '../../helpers/logError';
import { UnifiedUser, disunifyUser, unifyUser } from '../../models/unified/user';

const userService = new UserService(
    {
        async getUnifiedUser(req, res) {
            try {
                const connection = res.locals.connection;
                const userId = req.params.id;
                const fields = req.query.fields;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::GET USER', tenantId, thirdPartyId, thirdPartyToken, userId);
                if (thirdPartyId === 'hubspot') {
                    const formattedFields = [
                        ...String(fields || '').split(','),
                        'firstname',
                        'email',
                        'lastname',
                        'hs_object_id',
                        'phone',
                    ];
                    let user: any = await axios({
                        method: 'get',
                        url: `https://api.hubapi.com/settings/v3/users/${userId}?properties=${formattedFields}`,
                        headers: {
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                    });
                    user = ([user.data] as any[])?.[0];
                    user = unifyUser({ ...user, ...user?.properties });
                    res.send({ status: 'ok', result: { ...user, ...user?.properties } });
                } else if (thirdPartyId === 'zohocrm') {
                    const users = await axios({
                        method: 'get',
                        url: `https://www.zohoapis.com/crm/v3/users/${userId}`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                    });
                    let user = unifyUser(users.data.users?.[0]);
                    res.send({ status: 'ok', result: user });
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
                    res.send({ status: 'ok', result: user });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch lead', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getUnifiedUsers(req, res) {
            try {
                const connection = res.locals.connection;
                const fields = req.query.fields;
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;

                console.log('Revert::GET ALL USER', tenantId, thirdPartyId, thirdPartyToken);
                if (thirdPartyId === 'hubspot') {
                    const formattedFields = [
                        ...String(fields || '').split(','),
                        'firstname',
                        'email',
                        'lastname',
                        'hs_object_id',
                        'phone',
                    ];
                    const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${cursor ? `&after=${cursor}` : ''}`;
                    let users: any = await axios({
                        method: 'get',
                        url: `https://api.hubapi.com/settings/v3/users?properties=${formattedFields}&${pagingString}`,
                        headers: {
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                    });
                    const nextCursor = users.data?.paging?.next?.after || undefined;
                    users = users.data.results as any[];
                    users = users?.map((l: any) => unifyUser({ ...l, ...l?.properties }));
                    res.send({
                        status: 'ok',
                        next: nextCursor,
                        previous: undefined, // Field not supported by Hubspot.
                        results: users,
                    });
                } else if (thirdPartyId === 'zohocrm') {
                    const pagingString = `${pageSize ? `&per_page=${pageSize}` : ''}${
                        cursor ? `&page_token=${cursor}` : ''
                    }`; // FIXME: page_token unsupported.
                    let users: any = await axios({
                        method: 'get',
                        url: `https://www.zohoapis.com/crm/v3/users?${pagingString}`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                    });
                    const nextCursor = users.data?.info?.next_page_token || undefined;
                    const prevCursor = users.data?.info?.previous_page_token || undefined;
                    users = users.data.users;
                    users = users?.map((l: any) => unifyUser(l));
                    res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: users });
                } else if (thirdPartyId === 'sfdc') {
                    let pagingString = `${pageSize ? `ORDER+BY+Id+DESC+LIMIT+${pageSize}+` : ''}${
                        cursor ? `OFFSET+${cursor}` : ''
                    }`;
                    if (!pageSize && !cursor) {
                        pagingString = 'LIMIT 200';
                    }
                    const instanceUrl = connection.tp_account_url;
                    // TODO: Handle "ALL" for Hubspot & Zoho
                    const query =
                        !fields || fields === 'ALL'
                            ? `SELECT+fields(all)+from+User+${pagingString}`
                            : `SELECT+${(fields as string).split(',').join('+,+')}+from+User+${pagingString}`;
                    let users: any = await axios({
                        method: 'get',
                        url: `${instanceUrl}/services/data/v56.0/query/?q=${query}`,
                        headers: {
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                    });
                    const nextCursor = pageSize
                        ? String(users.data?.totalSize + (parseInt(String(cursor)) || 0))
                        : undefined;
                    const prevCursor =
                        cursor && parseInt(String(cursor)) > 0
                            ? String(parseInt(String(cursor)) - users.data?.totalSize)
                            : undefined;
                    users = users.data?.records;
                    users = users?.map((l: any) => unifyUser(l));
                    res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: users });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch leads', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createUser(req, res) {
            try {
                const userData = req.body as UnifiedUser;
                const connection = res.locals.connection;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const user = disunifyUser(userData, thirdPartyId);
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
                    res.send({
                        status: 'ok',
                        message: 'Hubspot user created',
                        result: user,
                    });
                } else if (thirdPartyId === 'zohocrm') {
                    await axios({
                        method: 'post',
                        url: `https://www.zohoapis.com/crm/v3/users`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                        data: JSON.stringify(user),
                    });
                    res.send({ status: 'ok', message: 'Zoho user created', result: user });
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
                    res.send({
                        status: 'ok',
                        message: 'SFDC user created',
                        result: userCreated.data,
                    });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not create lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { userService };
