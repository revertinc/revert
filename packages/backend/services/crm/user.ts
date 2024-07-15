import axios from 'axios';
import { TP_ID } from '@prisma/client';

import { UserService } from '../../generated/typescript/api/resources/crm/resources/user/service/UserService';
import { InternalServerError } from '../../generated/typescript/api/resources/common';
import { NotFoundError } from '../../generated/typescript/api/resources/common';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import revertAuthMiddleware from '../../helpers/authMiddleware';
import { logInfo, logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';
import { disunifyObject, unifyObject } from '../../helpers/crm/transform';
import { UnifiedUser } from '../../models/unified/user';
import { PipedriveUser } from '../../constants/pipedrive';
import { StandardObjects } from '../../constants/common';
import { getAssociationObjects, isValidAssociationTypeRequestedByUser } from '../../helpers/crm/hubspot';

const objType = StandardObjects.user;

const userService = new UserService(
    {
        async getUser(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const userId = req.params.id;
                const fields = req.query.fields;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const associations = req.query.associations ? req.query.associations.split(',') : [];

                logInfo(
                    'Revert::GET USER',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken,
                    userId
                );

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        const formattedFields = [
                            ...String(fields || '').split(','),
                            'firstname',
                            'email',
                            'lastname',
                            'hs_object_id',
                            'phone',
                        ];
                        const validAssociations = [...associations].filter((item) =>
                            isValidAssociationTypeRequestedByUser(item)
                        );
                        const invalidAssociations = [...associations].filter(
                            (item) =>
                                item !== 'undefined' && item !== 'null' && !isValidAssociationTypeRequestedByUser(item)
                        );
                        let url;
                        if (validAssociations.length > 0) {
                            url = `https://api.hubapi.com/settings/v3/users/${userId}?associations=${validAssociations}&properties=${formattedFields}`;
                        } else {
                            url = `https://api.hubapi.com/settings/v3/users/${userId}?properties=${formattedFields}`;
                        }

                        let user: any = await axios({
                            method: 'get',
                            url: url,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        user = ([user.data] as any[])?.[0];

                        const associatedData = await getAssociationObjects(
                            user?.associations,
                            thirdPartyToken,
                            thirdPartyId,
                            connection,
                            account,
                            invalidAssociations
                        );

                        user = await unifyObject<any, UnifiedUser>({
                            obj: { ...user, ...user?.properties, associations: associatedData },
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: { ...user, ...user?.properties } });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        const users = await axios({
                            method: 'get',
                            url: `https://www.zohoapis.com/crm/v3/users/${userId}`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                        });
                        let user = await unifyObject<any, UnifiedUser>({
                            obj: users.data.users?.[0],
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: user });
                        break;
                    }
                    case TP_ID.sfdc: {
                        const instanceUrl = connection.tp_account_url;
                        const users = await axios({
                            method: 'get',
                            url: `${instanceUrl}/services/data/v56.0/sobjects/User/${userId}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        let user = await unifyObject<any, UnifiedUser>({
                            obj: users.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: user });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const result = await axios.get<{ data: Partial<PipedriveUser> }>(
                            `${connection.tp_account_url}/v1/users/${userId}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        const user = result.data;
                        res.send({
                            status: 'ok',
                            result: await unifyObject<any, UnifiedUser>({
                                obj: user.data,
                                tpId: thirdPartyId,
                                objType,
                                tenantSchemaMappingId: connection.schema_mapping_id,
                                accountFieldMappingConfig: account.accountFieldMappingConfig,
                            }),
                        });
                        break;
                    }
                    case TP_ID.closecrm: {
                        let user: any = await axios({
                            method: 'get',
                            url: `https://api.close.com/api/v1/user/${userId}/`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });

                        user = await unifyObject<any, UnifiedUser>({
                            obj: user.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });
                        res.send({ status: 'ok', result: user });
                        break;
                    }
                    case TP_ID.ms_dynamics_365_sales: {
                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/api/data/v9.2/systemusers(${userId})`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                Accept: 'application/json',
                            },
                        });

                        const unifiedUser = await unifyObject<any, UnifiedUser>({
                            obj: result.data,
                            tpId: thirdPartyId,
                            objType,
                            tenantSchemaMappingId: connection.schema_mapping_id,
                            accountFieldMappingConfig: account.accountFieldMappingConfig,
                        });

                        res.send({ status: 'ok', result: unifiedUser });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch user', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getUsers(req, res) {
            try {
                const connection = res.locals.connection;
                const account = res.locals.account;
                const fields = req.query.fields;
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const associations = req.query.associations ? req.query.associations.split(',') : [];

                logInfo(
                    'Revert::GET ALL USER',
                    connection.app?.env?.accountId,
                    tenantId,
                    thirdPartyId,
                    thirdPartyToken
                );

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        const formattedFields = [
                            ...String(fields || '').split(','),
                            'firstname',
                            'email',
                            'lastname',
                            'hs_object_id',
                            'phone',
                        ];
                        const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&after=${cursor}` : ''
                        }`;
                        const validAssociations = [...associations].filter((item) =>
                            isValidAssociationTypeRequestedByUser(item)
                        );
                        const invalidAssociations = [...associations].filter(
                            (item) =>
                                item !== 'undefined' && item !== 'null' && !isValidAssociationTypeRequestedByUser(item)
                        );
                        let url;
                        if (validAssociations.length > 0) {
                            url = `https://api.hubapi.com/settings/v3/users?associations=${validAssociations}&properties=${formattedFields}&${pagingString}`;
                        } else {
                            url = `https://api.hubapi.com/settings/v3/users?properties=${formattedFields}&${pagingString}`;
                        }

                        let users: any = await axios({
                            method: 'get',
                            url: url,
                            headers: {
                                authorization: `Bearer ${thirdPartyToken}`,
                            },
                        });
                        const nextCursor = users.data?.paging?.next?.after || undefined;
                        users = users.data.results as any[];
                        users = await Promise.all(
                            users?.map(async (l: any) => {
                                const associatedData = await getAssociationObjects(
                                    l?.associations,
                                    thirdPartyToken,
                                    thirdPartyId,
                                    connection,
                                    account,
                                    invalidAssociations
                                );

                                return await unifyObject<any, UnifiedUser>({
                                    obj: { ...l, ...l?.properties, associations: associatedData },
                                    tpId: thirdPartyId,
                                    objType,
                                    tenantSchemaMappingId: connection.schema_mapping_id,
                                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                                });
                            })
                        );
                        res.send({
                            status: 'ok',
                            next: nextCursor,
                            previous: undefined, // Field not supported by Hubspot.
                            results: users,
                        });
                        break;
                    }
                    case TP_ID.zohocrm: {
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
                        users = await Promise.all(
                            users?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedUser>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: users });
                        break;
                    }
                    case TP_ID.sfdc: {
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
                        users = await Promise.all(
                            users?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedUser>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: users });
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${
                            cursor ? `&start=${cursor}` : ''
                        }`;
                        const result = await axios.get<{ data: Partial<PipedriveUser>[] }>(
                            `${connection.tp_account_url}/v1/users?${pagingString}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        const nextCursor = undefined;
                        const prevCursor = undefined;
                        const users = result.data.data;
                        const unifiedUsers = await Promise.all(
                            users?.map(
                                async (l) =>
                                    await unifyObject<any, UnifiedUser>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );
                        res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: unifiedUsers });
                        break;
                    }
                    case TP_ID.closecrm: {
                        const pagingString = `${pageSize ? `&_limit=${pageSize}` : ''}${
                            cursor ? `&_skip=${cursor}` : ''
                        }`;

                        let users: any = await axios({
                            method: 'get',
                            url: `https://api.close.com/api/v1/user/?${pagingString}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                Accept: 'application/json',
                            },
                        });
                        const hasMore = users.data?.has_more;
                        users = users.data?.data as any[];
                        users = await Promise.all(
                            users?.map(
                                async (l: any) =>
                                    await unifyObject<any, UnifiedUser>({
                                        obj: l,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );

                        let cursorVal = parseInt(String(cursor));
                        if (isNaN(cursorVal)) cursorVal = 0;
                        const nextSkipVal = hasMore ? cursorVal + pageSize : undefined;
                        const prevSkipVal = cursorVal > 0 ? String(Math.max(cursorVal - pageSize, 0)) : undefined;

                        res.send({
                            status: 'ok',
                            next: nextSkipVal ? String(nextSkipVal) : undefined,
                            previous: prevSkipVal,
                            results: users,
                        });
                        break;
                    }
                    case TP_ID.ms_dynamics_365_sales: {
                        const pagingString = cursor ? encodeURI(cursor).split('?')[1] : '';

                        const result = await axios({
                            method: 'get',
                            url: `${connection.tp_account_url}/api/data/v9.2/systemusers?${pagingString}`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                Accept: 'application/json',
                                Prefer: pageSize ? `odata.maxpagesize=${pageSize}` : '',
                            },
                        });

                        const unifiedUsers = await Promise.all(
                            result.data.value.map(
                                async (contact: any) =>
                                    await unifyObject<any, UnifiedUser>({
                                        obj: contact,
                                        tpId: thirdPartyId,
                                        objType,
                                        tenantSchemaMappingId: connection.schema_mapping_id,
                                        accountFieldMappingConfig: account.accountFieldMappingConfig,
                                    })
                            )
                        );

                        res.send({
                            status: 'ok',
                            next: result.data['@odata.nextLink'],
                            previous: undefined,
                            results: unifiedUsers,
                        });
                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch users', error);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createUser(req, res) {
            try {
                const userData = req.body as UnifiedUser;
                const connection = res.locals.connection;
                const account = res.locals.account;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const user = await disunifyObject<UnifiedUser>({
                    obj: userData,
                    tpId: thirdPartyId,
                    objType,
                    tenantSchemaMappingId: connection.schema_mapping_id,
                    accountFieldMappingConfig: account.accountFieldMappingConfig,
                });
                console.log('Revert::CREATE USER', connection.app?.env?.accountId, tenantId, user);

                switch (thirdPartyId) {
                    case TP_ID.hubspot: {
                        const response = await axios({
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
                            result: { id: response.data?.id, ...user },
                        });
                        break;
                    }
                    case TP_ID.zohocrm: {
                        await axios({
                            method: 'post',
                            url: `https://www.zohoapis.com/crm/v3/users`,
                            headers: {
                                authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                            },
                            data: JSON.stringify(user),
                        });
                        res.send({ status: 'ok', message: 'Zoho user created', result: user });
                        break;
                    }
                    case TP_ID.sfdc: {
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
                        break;
                    }
                    case TP_ID.pipedrive: {
                        const instanceUrl = connection.tp_account_url;
                        const pipedriveUser = user as Partial<PipedriveUser>;
                        const userCreated = await axios.post<{ data: Partial<PipedriveUser> }>(
                            `${instanceUrl}/v1/users`,
                            pipedriveUser,
                            {
                                headers: {
                                    Authorization: `Bearer ${thirdPartyToken}`,
                                },
                            }
                        );
                        res.send({
                            status: 'ok',
                            message: 'Pipedrive user created',
                            result: {
                                ...userCreated.data.data,
                            },
                        });
                        break;
                    }
                    case TP_ID.closecrm: {
                        throw new NotFoundError({ error: 'Method not allowed' });
                    }
                    case TP_ID.ms_dynamics_365_sales: {
                        const response = await axios({
                            method: 'post',
                            url: `${connection.tp_account_url}/api/data/v9.2/systemusers`,
                            headers: {
                                Authorization: `Bearer ${thirdPartyToken}`,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                            },
                            data: user,
                        });

                        res.send({
                            status: 'ok',
                            message: 'MS Dynamics 365 Contact created.',
                            result: response.data,
                            // result: user,
                        });

                        break;
                    }
                    default: {
                        throw new NotFoundError({ error: 'Unrecognized CRM' });
                    }
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not create user', error.response);
                if (isStandardError(error)) {
                    throw error;
                }
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { userService };
