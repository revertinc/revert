import { TP_ID } from '@prisma/client';
import { PipedriveContact } from '../../constants/pipedrive';
import { HubspotContact } from '../../constants/hubspot';
import { ZohoContact } from '../../constants/zoho';
import { SalesforceContact } from '../../constants/salesforce';
import { Subtype } from '../../constants/typeHelpers';
import { AllAssociation } from '../../constants/common';
import { getHubspotAssociationObj } from '../../helpers/hubspot';

export type ContactAssociation = Subtype<AllAssociation, 'dealId'>;

export interface UnifiedContact {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    id: string;
    remoteId: string; // TODO: Make this unique.
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: {
        [x in ContactAssociation]?: string;
    };
    additional: any;
}

export function unifyContact(contact: any): UnifiedContact {
    const unifiedContact: UnifiedContact = {
        remoteId: contact.id || contact.ContactID || contact.contact_id || contact.Id,
        id: contact.id || contact.ContactID || contact.contact_id || contact.Id,
        firstName:
            contact.firstName ||
            contact.firstname ||
            contact.FirstName ||
            contact.First_Name ||
            contact.first_name ||
            contact.name?.split(' ').slice(0, -1).join(' '),
        lastName:
            contact.lastName ||
            contact.lastname ||
            contact.LastName ||
            contact.Last_Name ||
            contact.last_name ||
            contact.name?.split(' ').slice(-1).join(' '),
        phone:
            contact.phone ||
            contact.phone_number ||
            contact.Phone ||
            (contact.phone || []).find((p: any) => p?.primary)?.value ||
            contact.phone?.[0]?.value ||
            contact.phones?.[0],
        email:
            contact.email ||
            contact.Email ||
            contact.primary_email ||
            (contact.email || []).find((e: any) => e?.primary)?.value ||
            contact.email?.[0]?.value ||
            contact.emails?.[0],
        createdTimestamp:
            contact.createdDate ||
            contact.CreatedDate ||
            contact.Created_Time ||
            contact.hs_timestamp ||
            contact.createdate ||
            contact.add_time,
        updatedTimestamp:
            contact.lastModifiedDate ||
            contact.LastModifiedDate ||
            contact.Modified_Time ||
            contact.lastmodifieddate ||
            contact.update_time,
        additional: {},
    };

    // Map additional fields
    Object.keys(contact).forEach((key) => {
        if (!(key in unifiedContact)) {
            unifiedContact['additional'][key] = contact[key];
        }
    });

    return unifiedContact;
}

export function toSalesforceContact(unifiedContact: UnifiedContact): Partial<SalesforceContact> {
    const salesforceContact: any = {
        Id: unifiedContact.remoteId,
        LastName: unifiedContact.lastName,
        FirstName: unifiedContact.firstName,
        Phone: unifiedContact.phone,
        Email: unifiedContact.email,
    };

    // Map custom fields
    if (unifiedContact.additional) {
        Object.keys(unifiedContact.additional).forEach((key) => {
            salesforceContact[key] = unifiedContact.additional?.[key];
        });
    }

    return salesforceContact;
}

export function toZohoContact(unifiedContact: UnifiedContact): ZohoContact {
    const zohoContact: any = {
        data: [{}],
        apply_feature_execution: [
            {
                name: 'layout_rules',
            },
        ],
        trigger: ['approval', 'workflow', 'blueprint'],
    };
    zohoContact.data[0].Id = unifiedContact.remoteId;
    zohoContact.data[0].First_Name = unifiedContact.firstName;
    zohoContact.data[0].Last_Name = unifiedContact.lastName;
    zohoContact.data[0].Email = unifiedContact.email;
    zohoContact.data[0].Phone = unifiedContact.phone;

    // Map custom fields
    if (unifiedContact.additional) {
        Object.keys(unifiedContact.additional).forEach((key) => {
            if (key !== 'Contact_Role') {
                zohoContact.data[0][key] = unifiedContact.additional?.[key];
            }
        });
    }

    return zohoContact;
}

export function toHubspotContact(unifiedContact: UnifiedContact): Partial<HubspotContact> {
    const hubspotContact: any = {
        properties: {
            id: unifiedContact.remoteId,
            firstname: unifiedContact.firstName,
            lastname: unifiedContact.lastName,
            email: unifiedContact.email,
            phone: unifiedContact.phone,
        },
    };

    // Map custom fields
    if (unifiedContact.additional) {
        Object.keys(unifiedContact.additional).forEach((key) => {
            hubspotContact['properties'][key] = unifiedContact.additional?.[key];
        });
    }
    if (unifiedContact.associations) {
        const associationObj = unifiedContact.associations;
        const associationArr = Object.keys(associationObj).map((key) => {
            return {
                to: {
                    id: associationObj[key as ContactAssociation],
                },
                types: [getHubspotAssociationObj(key as ContactAssociation, 'contact')],
            };
        });
        hubspotContact['associations'] = associationArr;
    }

    return hubspotContact;
}

export function toPipedriveContact(unifiedContact: UnifiedContact): Partial<PipedriveContact> {
    const pipedriveContact: any = {
        id: unifiedContact.remoteId,
        first_name: unifiedContact.firstName,
        last_name: unifiedContact.lastName,
        name: `${unifiedContact.firstName} ${unifiedContact.lastName}`,
        phone: unifiedContact.phone,
        email: unifiedContact.email,
    };

    // Map custom fields
    if (unifiedContact.additional) {
        Object.keys(unifiedContact.additional).forEach((key) => {
            pipedriveContact[key] = unifiedContact.additional?.[key];
        });
    }

    return pipedriveContact;
}

// To determine if a field is a user defined custom field using the properties API:
// Hubspot: `hubspotDefined` is false and calculated is false
// ZohoCRM: `custom_field` is true
// SFDC: `custom` is true.
export function disunifyContact(contact: UnifiedContact, integrationId: string): any {
    if (integrationId === TP_ID.sfdc) {
        return toSalesforceContact(contact);
    } else if (integrationId === TP_ID.hubspot) {
        return toHubspotContact(contact);
    } else if (integrationId === TP_ID.zohocrm) {
        return toZohoContact(contact);
    } else if (integrationId === TP_ID.pipedrive) {
        return toPipedriveContact(contact);
    }
}
