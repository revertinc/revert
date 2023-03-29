import axios from 'axios';
import { unifyLead } from '../models/unified/unifiedLead';
import { filterLeadsFromContactsForHubspot } from '../helpers/filterLeadsFromContacts';
import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

class LeadService {
    async getUnifiedLead(
        req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        res: Response<any, Record<string, any>, number>
    ) {
        const connection = res.locals.connection;
        const thirdPartyId = connection.tp_id;
        const thirdPartyToken = connection.tp_access_token;
        const tenantId = connection.t_id;
        const leadId = req.params.id;
        const fields = req.query.fields;
        console.log('Revert::GET LEAD', tenantId, thirdPartyId, thirdPartyToken, leadId);
        if (thirdPartyId === 'hubspot') {
            let lead: any = await axios({
                method: 'get',
                url: `https://api.hubapi.com/crm/v3/objects/contacts/${leadId}?properties=${fields}`,
                headers: {
                    authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            lead = filterLeadsFromContactsForHubspot([lead.data] as any[])?.[0];
            return {
                result: unifyLead({ ...lead, ...lead?.properties }),
            };
        } else if (thirdPartyId === 'zohocrm') {
            const leads = await axios({
                method: 'get',
                url: `https://www.zohoapis.com/crm/v3/Leads/${leadId}?fields=${fields}`,
                headers: {
                    authorization: `Zoho-oauthtoken ${thirdPartyToken}`,
                },
            });
            let lead = leads.data.data?.[0];
            return { result: unifyLead(lead) };
        } else if (thirdPartyId === 'sfdc') {
            const leads = await axios({
                method: 'get',
                url: `https://revert2-dev-ed.develop.my.salesforce.com/services/data/v56.0/sobjects/Lead/${leadId}`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                },
            });
            let lead = leads.data;
            return { result: unifyLead(lead) };
        } else {
            return {
                error: 'Unrecognised CRM',
            };
        }
    }
}

export default new LeadService();
