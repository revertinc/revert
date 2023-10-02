import axios from 'axios';
import { TP_ID, connections } from '@prisma/client';
import { objectNameMapping } from '../../constants/common';
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
    const tpId = connection.tp_id as TP_ID;
    const crmObjectName = (objectNameMapping[objectName] || {})[tpId] || objectName;

    switch (tpId) {
        case TP_ID.hubspot: {
            const response = await axios.get(`https://api.hubapi.com/crm/v3/properties/${crmObjectName}`, {
                headers: { authorization: `Bearer ${thirdPartyToken}` },
            });
            return (response.data.results || []).map((f: any) => ({
                fieldName: f.name,
                fieldType: f.fieldType,
                fieldDescription: f.label,
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
                fieldName: f.api_name,
                fieldType: f.json_type,
                fieldDescription: '',
            }));
        }
        case TP_ID.sfdc: {
            const instanceUrl = connection.tp_account_url;
            const response = await axios.get(`${instanceUrl}/services/data/v56.0/sobjects/${crmObjectName}/describe`, {
                headers: { authorization: `Bearer ${thirdPartyToken}` },
            });
            return (response.data.fields || []).map((f: any) => ({
                fieldName: f.name,
                fieldType: f.type,
                fieldDescription: '',
            }));
        }
        case TP_ID.pipedrive: {
            const instanceUrl = connection.tp_account_url;
            const response = await axios.get(`${instanceUrl}/v1/${crmObjectName}Fields`, {
                headers: { authorization: `Bearer ${thirdPartyToken}` },
            });
            return (response.data.data || []).map((f: any) => ({
                fieldName: f.key,
                fieldType: f.field_type,
                fieldDescription: '',
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
    const tpId = connection.tp_id as TP_ID;
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
                        fieldType: objectProperties.fieldType,
                        name: objectProperties.fieldName,
                        label: objectProperties.fieldDescription,
                        groupName: objectProperties.groupName,
                    }),
                });
                return { status: 'ok', data: response.data };
            }
            case TP_ID.zohocrm: {
                // TODO: add zoho
            }
            case TP_ID.sfdc: {
                // TODO: add Salesforce
            }
            case TP_ID.pipedrive: {
                // TODO: add pipedrive
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
