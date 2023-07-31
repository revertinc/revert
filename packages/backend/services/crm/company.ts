import axios from 'axios';

import logError from '../../helpers/logError';
import { CompanyService } from '../../generated/typescript/api/resources/crm/resources/company/service/CompanyService';
import { NotFoundError } from '../../generated/typescript/api/resources/common';
import revertTenantMiddleware from '../../helpers/tenantIdMiddleware';
import revertAuthMiddleware from '../../helpers/authMiddleware';
import { InternalServerError } from '../../generated/typescript/api/resources/common';
import { unifyCompany, disunifyCompany, UnifiedCompany } from '../../models/unified/company';

const companyService = new CompanyService(
    {
        async getCompany(req, res) {
            try {
                const connection = res.locals.connection;
                const companyId = req.params.id;
                const fields = req.query.fields;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::GET COMPANY', tenantId, thirdPartyId, thirdPartyToken, companyId);
                if (thirdPartyId === 'hubspot') {
                    const formattedFields = [
                        ...String(fields || '').split(','),
                        'name',
                        'hs_object_id',
                        'city',
                        'state',
                        'zip',
                        'industry',
                        'description',
                        'numberofemployees',
                        'phone',
                        'annualrevenue',
                    ];
                    const company = await axios({
                        method: 'get',
                        url: `https://api.hubapi.com/crm/v3/objects/companies/${companyId}?properties=${formattedFields}`,
                        headers: {
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                    });

                    res.send({ status: 'ok', result: unifyCompany({ ...company.data, ...company.data?.properties }) });
                } else if (thirdPartyId === 'zohocrm') {
                    let company: any = await axios({
                        method: 'get',
                        url: `https://www.zohoapis.com/crm/v3/Accounts/${companyId}?fields=${fields}`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                    });
                    company = unifyCompany(company.data.data?.[0]);
                    res.send({ status: 'ok', result: company });
                } else if (thirdPartyId === 'sfdc') {
                    const instanceUrl = connection.tp_account_url;
                    const company = await axios({
                        method: 'get',
                        url: `${instanceUrl}/services/data/v56.0/sobjects/Account/${companyId}`,
                        headers: {
                            Authorization: `Bearer ${thirdPartyToken}`,
                        },
                    });
                    res.send({ status: 'ok', result: unifyCompany(company.data) });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch lead', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async getCompanies(req, res) {
            try {
                const connection = res.locals.connection;
                const fields = req.query.fields;
                const pageSize = parseInt(String(req.query.pageSize));
                const cursor = req.query.cursor;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::GET ALL COMPANIES', tenantId, thirdPartyId, thirdPartyToken);
                if (thirdPartyId === 'hubspot') {
                    const formattedFields = [
                        ...String(fields || '').split(','),
                        'name',
                        'hs_object_id',
                        'city',
                        'state',
                        'zip',
                        'industry',
                        'description',
                        'numberofemployees',
                        'phone',
                        'annualrevenue',
                    ];
                    const pagingString = `${pageSize ? `&limit=${pageSize}` : ''}${cursor ? `&after=${cursor}` : ''}`;
                    let companies: any = await axios({
                        method: 'get',
                        url: `https://api.hubapi.com/crm/v3/objects/companies?properties=${formattedFields}&${pagingString}`,
                        headers: {
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                    });
                    const nextCursor = companies.data?.paging?.next?.after || undefined;
                    companies = companies.data.results as any[];
                    companies = companies?.map((c: any) => unifyCompany({ ...c, ...c?.properties }));
                    res.send({
                        status: 'ok',
                        next: nextCursor,
                        previous: undefined, // Field not supported by Hubspot.
                        results: companies,
                    });
                } else if (thirdPartyId === 'zohocrm') {
                    const pagingString = `${pageSize ? `&per_page=${pageSize}` : ''}${
                        cursor ? `&page_token=${cursor}` : ''
                    }`;
                    let companies: any = await axios({
                        method: 'get',
                        url: `https://www.zohoapis.com/crm/v3/Accounts?fields=${fields}${pagingString}`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                    });
                    const nextCursor = companies.data?.info?.next_page_token || undefined;
                    const prevCursor = companies.data?.info?.previous_page_token || undefined;
                    companies = companies.data.data;
                    companies = companies?.map((l: any) => unifyCompany(l));
                    res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: companies });
                } else if (thirdPartyId === 'sfdc') {
                    let pagingString = `${pageSize ? `ORDER+BY+Id+DESC+LIMIT+${pageSize}+` : ''}${
                        cursor ? `OFFSET+${cursor}` : ''
                    }`;
                    if (!pageSize && !cursor) {
                        pagingString = 'LIMIT 200';
                    }
                    const instanceUrl = connection.tp_account_url;
                    // NOTE: Handle "ALL" for Hubspot & Zoho
                    const query =
                        !fields || fields === 'ALL'
                            ? `SELECT+fields(all)+from+Account+${pagingString}`
                            : `SELECT+${(fields as string).split(',').join('+,+')}+from+Account+${pagingString}`;
                    let companies: any = await axios({
                        method: 'get',
                        url: `${instanceUrl}/services/data/v56.0/query/?q=${query}`,
                        headers: {
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                    });
                    const nextCursor = pageSize
                        ? String(companies.data?.totalSize + (parseInt(String(cursor)) || 0))
                        : undefined;
                    const prevCursor =
                        cursor && parseInt(String(cursor)) > 0
                            ? String(parseInt(String(cursor)) - companies.data?.totalSize)
                            : undefined;
                    companies = companies.data?.records;
                    companies = companies?.map((l: any) => unifyCompany(l));
                    res.send({ status: 'ok', next: nextCursor, previous: prevCursor, results: companies });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not fetch leads', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async createCompany(req, res) {
            try {
                const companyData = req.body as UnifiedCompany;
                const connection = res.locals.connection;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const company = disunifyCompany(companyData, thirdPartyId);
                console.log('Revert::CREATE COMPANY', tenantId, company);
                if (thirdPartyId === 'hubspot') {
                    await axios({
                        method: 'post',
                        url: `https://api.hubapi.com/crm/v3/objects/companies/`,
                        headers: {
                            'content-type': 'application/json',
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                        data: JSON.stringify(company),
                    });
                    res.send({
                        status: 'ok',
                        message: 'Hubspot company created',
                        result: company,
                    });
                } else if (thirdPartyId === 'zohocrm') {
                    await axios({
                        method: 'post',
                        url: `https://www.zohoapis.com/crm/v3/Accounts`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                        data: JSON.stringify(company),
                    });
                    res.send({ status: 'ok', message: 'Zoho company created', result: company });
                } else if (thirdPartyId === 'sfdc') {
                    const instanceUrl = connection.tp_account_url;
                    const companyCreated = await axios({
                        method: 'post',
                        url: `${instanceUrl}/services/data/v56.0/sobjects/Account/`,
                        headers: {
                            'content-type': 'application/json',
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                        data: JSON.stringify(company),
                    });
                    res.send({
                        status: 'ok',
                        message: 'SFDC company created',
                        result: companyCreated.data,
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
        async updateCompany(req, res) {
            try {
                const connection = res.locals.connection;
                const companyData = req.body as UnifiedCompany;
                const companyId = req.params.id;
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                const company = disunifyCompany(companyData, thirdPartyId);
                console.log('Revert::UPDATE COMPANY', tenantId, company, companyId);
                if (thirdPartyId === 'hubspot') {
                    await axios({
                        method: 'patch',
                        url: `https://api.hubapi.com/crm/v3/objects/companies/${companyId}`,
                        headers: {
                            'content-type': 'application/json',
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                        data: JSON.stringify(company),
                    });
                    res.send({
                        status: 'ok',
                        message: 'Hubspot company updated',
                        result: company,
                    });
                } else if (thirdPartyId === 'zohocrm') {
                    await axios({
                        method: 'put',
                        url: `https://www.zohoapis.com/crm/v3/Accounts/${companyId}`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                        data: JSON.stringify(company),
                    });
                    res.send({ status: 'ok', message: 'Zoho company updated', result: company });
                } else if (thirdPartyId === 'sfdc') {
                    const instanceUrl = connection.tp_account_url;
                    await axios({
                        method: 'patch',
                        url: `${instanceUrl}/services/data/v56.0/sobjects/Account/${companyId}`,
                        headers: {
                            'content-type': 'application/json',
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                        data: JSON.stringify(company),
                    });
                    res.send({ status: 'ok', message: 'SFDC company updated', result: company });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not update lead', error.response);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
        async searchCompanies(req, res) {
            try {
                const connection = res.locals.connection;
                const fields = req.query.fields;
                const searchCriteria: any = req.body.searchCriteria;
                const formattedFields = (fields || '').split('').filter(Boolean);
                const thirdPartyId = connection.tp_id;
                const thirdPartyToken = connection.tp_access_token;
                const tenantId = connection.t_id;
                console.log('Revert::SEARCH COMPANY', tenantId, searchCriteria, fields);
                if (thirdPartyId === 'hubspot') {
                    let companies: any = await axios({
                        method: 'post',
                        url: `https://api.hubapi.com/crm/v3/objects/companies/search`,
                        headers: {
                            'content-type': 'application/json',
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                        data: JSON.stringify({
                            ...searchCriteria,
                            properties: [
                                'name',
                                'hs_object_id',
                                'city',
                                'state',
                                'zip',
                                'industry',
                                'description',
                                'numberofemployees',
                                'phone',
                                'annualrevenue',
                                ...formattedFields,
                            ],
                        }),
                    });
                    companies = companies.data.results as any[];
                    companies = companies?.map((c: any) => unifyCompany({ ...c, ...c?.properties }));
                    res.send({
                        status: 'ok',
                        results: companies,
                    });
                } else if (thirdPartyId === 'zohocrm') {
                    let companies: any = await axios({
                        method: 'get',
                        url: `https://www.zohoapis.com/crm/v3/Accounts/search?criteria=${searchCriteria}`,
                        headers: {
                            authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                        },
                    });
                    companies = companies.data.data;
                    companies = companies?.map((c: any) => unifyCompany(c));
                    res.send({ status: 'ok', results: companies });
                } else if (thirdPartyId === 'sfdc') {
                    const instanceUrl = connection.tp_account_url;
                    let companies: any = await axios({
                        method: 'get',
                        url: `${instanceUrl}/services/data/v56.0/search?q=${searchCriteria}`,
                        headers: {
                            authorization: `Bearer ${thirdPartyToken}`,
                        },
                    });
                    companies = companies?.data?.searchRecords;
                    companies = companies?.map((c: any) => unifyCompany(c));
                    res.send({ status: 'ok', results: companies });
                } else {
                    throw new NotFoundError({ error: 'Unrecognized CRM' });
                }
            } catch (error: any) {
                logError(error);
                console.error('Could not search CRM', error);
                throw new InternalServerError({ error: 'Internal server error' });
            }
        },
    },
    [revertAuthMiddleware(), revertTenantMiddleware()]
);

export { companyService };
