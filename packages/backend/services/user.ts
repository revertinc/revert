import axios from 'axios';
import { UnifiedUser, disunifyUser, unifyUser } from '../models/unified/user';
import { NotFoundError } from '../generated/typescript/api/resources/common';
import { connections } from '@prisma/client';

class UserService {
    async getUnifiedUser({
        connection,
        userId,
        fields,
    }: {
        connection: connections;
        userId: string;
        fields?: string;
    }): Promise<{
        status: 'ok';
        result: UnifiedUser;
    }> {
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
            return { status: 'ok', result: { ...user, ...user?.properties } };
        } else if (thirdPartyId === 'zohocrm') {
            const users = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/users/${userId}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            let user = unifyUser(users.data.users?.[0]);
            return { status: 'ok', result: user };
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
            return { status: 'ok', result: user };
        } else {
            throw new NotFoundError({ error: 'Unrecognized CRM' });
        }
    }
    async getUnifiedUsers({
        connection,
        fields,
        pageSize,
        cursor,
    }: {
        connection: connections;
        fields?: string;
        pageSize?: number;
        cursor?: string;
    }): Promise<{
        status: 'ok';
        next?: string;
        previous?: string;
        results: UnifiedUser[];
    }> {
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
            return {
                status: 'ok',
                next: nextCursor,
                previous: undefined, // Field not supported by Hubspot.
                results: users,
            };
        } else if (thirdPartyId === 'zohocrm') {
            const pagingString = `${pageSize ? `&per_page=${pageSize}` : ''}${cursor ? `&page_token=${cursor}` : ''}`; // FIXME: page_token unsupported.
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
            return { status: 'ok', next: nextCursor, previous: prevCursor, results: users };
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
            const nextCursor = pageSize ? String(users.data?.totalSize + (parseInt(String(cursor)) || 0)) : undefined;
            const prevCursor =
                cursor && parseInt(String(cursor)) > 0
                    ? String(parseInt(String(cursor)) - users.data?.totalSize)
                    : undefined;
            users = users.data?.records;
            users = users?.map((l: any) => unifyUser(l));
            return { status: 'ok', next: nextCursor, previous: prevCursor, results: users };
        } else {
            throw new NotFoundError({ error: 'Unrecognized CRM' });
        }
    }
    async createUser({ connection, userData }: { userData: UnifiedUser; connection: connections }): Promise<{
        status: 'ok';
        result: any;
        message: string;
    }> {
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
            throw new NotFoundError({ error: 'Unrecognized CRM' });
        }
    }
}

export default new UserService();
