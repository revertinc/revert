import axios from 'axios';
import { TP_ID, connections } from '@prisma/client';
import { CRM_TP_ID, objectNameMapping } from '../../constants/common';
import { InternalServerError, NotFoundError } from '../../generated/typescript/api/resources/common';
import { FieldDetailsTypeRequest } from '../../generated/typescript/api/resources/crm';
import { logError } from '../../helpers/logger';
import { isStandardError } from '../../helpers/error';

export const getObjectPropertiesForConnection = async ({
    objectName,
    connection,
}: {
    objectName: string;
    connection: connections;
}) => {
    const thirdPartyToken = connection.tp_access_token;
    const tpId = connection.tp_id as CRM_TP_ID;
    const crmObjectName = (objectNameMapping[objectName] || {})[tpId] || objectName;

    switch (tpId) {
        case TP_ID.hubspot: {
            const response = await axios.get(`https://api.hubapi.com/crm/v3/properties/${crmObjectName}`, {
                headers: { authorization: `Bearer ${thirdPartyToken}` },
            });
            return (response.data.results || []).map((f: any) => ({
                name: f.name,
                type: f.type,
                description: f.label,
            }));
        }
        case TP_ID.zohocrm: {
            const response = await axios.get(
                `https://www.zohoapis.com/crm/v3/settings/fields?module=${crmObjectName}`,
                {
                    headers: { authorization: `Zoho-oauthtoken ${thirdPartyToken}` },
                }
            );
            return (response.data.fields || []).map((f: any) => ({
                name: f.api_name,
                type: f.json_type,
                description: '',
            }));
        }
        case TP_ID.sfdc: {
            const instanceUrl = connection.tp_account_url;
            const response = await axios.get(`${instanceUrl}/services/data/v56.0/sobjects/${crmObjectName}/describe`, {
                headers: { authorization: `Bearer ${thirdPartyToken}` },
            });
            return (response.data.fields || []).map((f: any) => ({
                name: f.name,
                type: f.type,
                description: '',
            }));
        }
        case TP_ID.pipedrive: {
            const instanceUrl = connection.tp_account_url;
            const response = await axios.get(`${instanceUrl}/v1/${crmObjectName}Fields`, {
                headers: { authorization: `Bearer ${thirdPartyToken}` },
            });
            return (response.data.data || []).map((f: any) => ({
                name: f.key,
                type: f.field_type,
                description: '',
            }));
        }
        case TP_ID.ms_dynamics_365_sales: {
            const response = await axios({
                method: 'get',
                url: `${connection.tp_account_url}/api/data/v9.2/EntityDefinitions(LogicalName='${crmObjectName}')/Attributes`,
                headers: {
                    Authorization: `Bearer ${thirdPartyToken}`,
                    'OData-MaxVersion': '4.0',
                    'OData-Version': '4.0',
                    Accept: 'application/json',
                },
            });
            return (response.data.value || []).map((f: any) => ({
                name: f.LogicalName,
                type: f.AttributeTypeName.Value,
                description: f.Description ? f.Description.LocalizedLabels : '',
            }));
        }
        default: {
            throw new NotFoundError({ error: 'Unrecognised CRM' });
        }
    }
};

export const setObjectPropertiesForConnection = async ({
    objectName,
    objectProperties,
    connection,
}: {
    objectName: string;
    objectProperties: FieldDetailsTypeRequest;
    connection: connections;
}) => {
    const thirdPartyToken = connection.tp_access_token;
    const tpId = connection.tp_id as CRM_TP_ID;
    const crmObjectName = (objectNameMapping[objectName] || {})[tpId] || objectName;

    try {
        switch (tpId) {
            case TP_ID.hubspot: {
                const response = await axios({
                    method: 'POST',
                    url: `https://api.hubapi.com/crm/v3/properties/${crmObjectName}`,
                    headers: {
                        'content-type': 'application/json',
                        authorization: `Bearer ${thirdPartyToken}`,
                    },
                    data: JSON.stringify({
                        type: objectProperties.type,
                        name: objectProperties.name,
                        label: (objectProperties.additional as any)?.fieldDescription,
                        ...(!!objectProperties.additional ? (objectProperties.additional as any) : {}),
                    }),
                });
                return { status: 'ok', data: response.data };
            }
            case TP_ID.zohocrm: {
                // NOTE: The zoho api does not support custom field creation via an api.
            }
            case TP_ID.sfdc: {
                // TODO: add Salesforce
            }
            case TP_ID.pipedrive: {
                const instanceUrl = connection.tp_account_url;
                const response = await axios.post(
                    `${instanceUrl}/v1/${crmObjectName}Fields`,
                    {
                        field_type: objectProperties.type,
                        name: objectProperties.name,
                    },
                    {
                        headers: { authorization: `Bearer ${thirdPartyToken}` },
                    }
                );
                return { status: 'ok', data: response.data };
            }
            default: {
                throw new NotFoundError({ error: 'Unrecognised CRM' });
            }
        }
    } catch (error: any) {
        logError(error);
        console.error('Could not create contact property', error.response);
        if (isStandardError(error)) {
            throw error;
        }
        throw new InternalServerError({ error: 'Could not create contact property ' });
    }
};
