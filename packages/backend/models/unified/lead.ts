import { TP_ID } from '@prisma/client';
import { PipedriveContact, PipedriveLead, PipedriveOrganization } from '../../constants/pipedrive';
import { HubspotLead } from '../../constants/hubspot';
import { ZohoLead } from '../../constants/zoho';
import { SalesforceLead } from '../../constants/salesforce';

export type LeadAssociation = 'personId' | 'organizationId';

export interface UnifiedLead {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    id: string;
    remoteId: string; // TODO: Make this unique.
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: {
        [x in LeadAssociation]?: string;
    };
    additional: any;
    // QUESTION: Add value of lead and expected close date here?
}

// FIXME: type support can be better
export function unifyLead(lead: any, tpId: TP_ID): UnifiedLead {
    const unifiedlead: UnifiedLead = {
        id: lead.id || lead.Id || lead.vid,
        remoteId: lead.id || lead.Id || lead.vid,
        firstName:
            lead.firstName ||
            lead.First_Name ||
            lead.FirstName ||
            lead.firstname ||
            lead.title?.split(' ').slice(0, -1).join(' '),
        lastName:
            lead.lastName ||
            lead.Last_Name ||
            lead.LastName ||
            lead.lastname ||
            lead.title?.split(' ').slice(-1).join(' '),
        email:
            lead.email ||
            lead.Email ||
            lead.person?.primary_email ||
            (lead.person?.email || []).find((e: any) => e?.primary)?.value ||
            lead.person?.email?.[0]?.value ||
            lead.organization?.cc_email,
        phone:
            lead.phone ||
            lead.Phone ||
            lead.PhoneNumber ||
            (lead.person?.phone || []).find((p: any) => p?.primary)?.value ||
            lead.person?.phone?.[0]?.value,
        createdTimestamp:
            lead.createdDate ||
            lead.CreatedDate ||
            lead.Created_Time ||
            lead.hs_timestamp ||
            lead.createdate ||
            lead.add_time,
        updatedTimestamp:
            lead.lastModifiedDate ||
            lead.LastModifiedDate ||
            lead.Modified_Time ||
            lead.lastmodifieddate ||
            lead.update_time,
        additional: {},
        associations: {
            ...(tpId === TP_ID.pipedrive && {
                personId: lead.person_id || lead.person?.id,
                organizationId: lead.organization_id || lead.organization?.id,
            }),
        },
    };

    // Map additional fields
    Object.keys(lead).forEach((key) => {
        if (!(key in unifiedlead)) {
            unifiedlead['additional'][key] = lead[key];
        }
    });
    return unifiedlead;
}

export function toSalesforceLead(unifiedLead: UnifiedLead): SalesforceLead {
    const salesforceLead: any = {};

    // Map common fields
    salesforceLead.Id = unifiedLead.remoteId;
    salesforceLead.LastName = unifiedLead.lastName;
    salesforceLead.FirstName = unifiedLead.firstName;
    salesforceLead.Phone = unifiedLead.phone;
    salesforceLead.Email = unifiedLead.email;

    // Map custom fields
    if (unifiedLead.additional) {
        Object.keys(unifiedLead.additional).forEach((key) => {
            salesforceLead[key] = unifiedLead.additional?.[key];
        });
    }

    return salesforceLead as SalesforceLead;
}

export function toZohoLead(unifiedLead: UnifiedLead): ZohoLead {
    const zohoLead: any = {
        data: [{}],
        apply_feature_execution: [
            {
                name: 'layout_rules',
            },
        ],
        trigger: ['approval', 'workflow', 'blueprint'],
    };
    zohoLead.data[0].Id = unifiedLead.remoteId;
    zohoLead.data[0].First_Name = unifiedLead.firstName;
    zohoLead.data[0].Last_Name = unifiedLead.lastName;
    zohoLead.data[0].Email = unifiedLead.email;
    zohoLead.data[0].Phone = unifiedLead.phone;

    // Map custom fields
    if (unifiedLead.additional) {
        Object.keys(unifiedLead.additional).forEach((key) => {
            zohoLead.data[0][key] = unifiedLead.additional?.[key];
        });
    }

    return zohoLead;
}

export function toHubspotLead(lead: UnifiedLead): Partial<HubspotLead> {
    const hubspotLead: any = {
        properties: {
            firstname: lead.firstName,
            lastname: lead.lastName,
            email: lead.email,
            company: lead.additional?.company,
            phone: lead.phone,
            city: lead.additional?.address?.city,
            state: lead.additional?.address?.state,
            zip: lead.additional?.address?.zipCode,
            country: lead.additional?.address?.country,
            website: lead.additional?.website,
            hs_lead_source: lead.additional?.leadSource!,
            hs_lead_status: lead.additional?.hs_lead_status || undefined,
        },
    };

    // Map custom fields
    if (lead.additional) {
        Object.keys(lead.additional).forEach((key) => {
            hubspotLead['properties'][key] = lead.additional?.[key];
        });
    }
    return hubspotLead;
}

export function toPipedriveLead(lead: UnifiedLead): Partial<PipedriveLead> {
    const pipedriveLead: Partial<PipedriveLead> = {
        id: lead.id,
        title: `${lead.firstName} ${lead.lastName}`,
        add_time: lead.createdTimestamp,
        update_time: lead.updatedTimestamp,
        ...(lead.associations?.personId && {
            person_id: lead.associations.personId,
        }),
        ...(lead.associations?.organizationId && {
            organization_id: lead.associations.organizationId,
        }),
    };

    // Map custom fields
    // if (lead.additional) {
    //     Object.keys(lead.additional).forEach((key) => {
    //         pipedriveLead[key] = lead.additional?.[key];
    //     });
    // }
    return pipedriveLead;
}

export function unifiedLeadToPipedrivePerson(lead: UnifiedLead): Partial<PipedriveContact> {
    return {
        id: lead.associations?.personId,
        first_name: lead.firstName,
        last_name: lead.lastName,
        name: `${lead.firstName} ${lead.lastName}`,
        phone: [{ value: lead.phone, primary: true, label: 'personal' }],
        email: [{ value: lead.email, primary: true, label: 'personal' }],
        primary_email: lead.email,
    };
}

export function unifiedLeadToPipedriveOrganization(lead: UnifiedLead): Partial<PipedriveOrganization> {
    return {
        id: lead.associations?.organizationId,
        name: lead.firstName,
        cc_email: lead.email,
    };
}

export function disunifyLead(
    lead: UnifiedLead,
    integrationId: string
): Partial<SalesforceLead> | Partial<HubspotLead> | Partial<ZohoLead> | Partial<PipedriveLead> | {} {
    if (integrationId === TP_ID.sfdc) {
        return toSalesforceLead(lead);
    } else if (integrationId === TP_ID.hubspot) {
        return toHubspotLead(lead);
    } else if (integrationId === TP_ID.zohocrm) {
        return toZohoLead(lead);
    } else if (integrationId === TP_ID.pipedrive) {
        return toPipedriveLead(lead);
    } else return {};
}
