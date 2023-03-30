import axios from 'axios';
import { unifyCompany } from '../models/unified/unifiedCompany';
import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

class CompanyService {
    async getUnifiedCompany(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const companyId = req.params.id;
        const fields = req.query.fields;
        console.log('Revert::GET COMPANY', tenantId, thirdPartyId, thirdPartyToken, companyId);
        if (thirdPartyId === 'hubspot') {
            const company = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/companies/${companyId}?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });

            return {
                result: unifyCompany({ ...company.data, ...company.data?.properties }),
            };
        } else if (thirdPartyId === 'zohocrm') {
            const company = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Accounts/${companyId}?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            return { result: unifyCompany(company.data.data) };
        } else if (thirdPartyId === 'sfdc') {
            const company = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Account/${companyId}`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            return { result: unifyCompany(company.data) };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
    async getUnifiedCompanies(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const fields = req.query.fields;
        console.log('Revert::GET ALL COMPANIES', tenantId, thirdPartyId, thirdPartyToken);
        if (thirdPartyId === 'hubspot') {
            let companies: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/companies?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            companies = companies.data.results as any[];
            companies = companies?.map((c: any) => unifyCompany({ ...c, ...c?.properties }));
            return {
                results: companies,
            };
        } else if (thirdPartyId === 'zohocrm') {
            let companies: any = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Accounts?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            companies = companies.data.data;
            companies = companies?.map((l: any) => unifyCompany(l));
            return { results: companies };
        } else if (thirdPartyId === 'sfdc') {
            // NOTE: Handle "ALL" for Hubspot & Zoho
            const query =
                fields === 'ALL'
                    ? 'SELECT+fields(all)+from+Account+limit+200'
                    : `SELECT+${(fields as string).split(',').join('+,+')}+from+Account`;
            let companies: any = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/query/?q=${query}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            companies = companies.data?.records;
            companies = companies?.map((l: any) => unifyCompany(l));
            return { results: companies };
        } else {
            return { error: 'Unrecognized CRM' };
        }
    }
    async searchUnifiedCompanies(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const searchCriteria = req.body.searchCriteria;
        const fields = String(req.query.fields || '').split(',');
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
                    properties: ['name', 'hs_object_id', ...fields],
                }),
            });
            companies = companies.data.results as any[];
            companies = companies?.map((c: any) => unifyCompany({ ...c, ...c?.properties }));
            return {
                status: 'ok',
                results: companies,
            };
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
            return { status: 'ok', results: companies };
        } else if (thirdPartyId === 'sfdc') {
            let companies: any = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/search?q=${searchCriteria}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            companies = companies?.data?.searchRecords;
            companies = companies?.map((c: any) => unifyCompany(c));
            return { status: 'ok', results: companies };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
}

export default new CompanyService();
