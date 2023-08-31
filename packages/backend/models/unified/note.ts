import { TP_ID, accountFieldMappingConfig } from '@prisma/client';
import { getHubspotAssociationObj } from '../../helpers/hubspot';
import { transformFieldMappingToModel, transformModelToFieldMapping } from '../../helpers/transformSchemaMapping';
import { Subtype } from '../../constants/typeHelpers';
import { AllAssociation, StandardObjects } from '../../constants/common';

export type NoteAssociation = Subtype<AllAssociation, 'contactId' | 'companyId' | 'leadId' | 'dealId'>;

export interface UnifiedNote {
    content: string;
    id: string;
    remoteId: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
    associations?: {
        [x in NoteAssociation]?: string;
    };
    additional: any;
}

export async function unifyNote(
    note: any,
    tpId: TP_ID,
    tenantSchemaMappingId?: string,
    accountFieldMappingConfig?: accountFieldMappingConfig
): Promise<UnifiedNote> {
    const transformedNote = await transformFieldMappingToModel({
        obj: note,
        tpId,
        objType: StandardObjects.note,
        tenantSchemaMappingId,
        accountFieldMappingConfig
    });
    const unifiednote = {
        ...transformedNote,
        additional: {
            ...(transformedNote.additional || {}),
        },
        associations: {
            ...(tpId === TP_ID.pipedrive && {
                contactId: note.person_id,
                companyId: note.org_id,
                leadId: note.lead_id,
                dealId: note.deal_id,
            }),
        },
    } as UnifiedNote;

    // Map additional fields
    Object.keys(note).forEach((key) => {
        if (!(key in unifiednote) && key !== 'properties') {
            unifiednote['additional'][key] = note[key];
        }
    });

    return unifiednote;
}

export async function toSalesforceNote(unified: UnifiedNote, tpId: TP_ID) {
    const transformedObj = await transformModelToFieldMapping({
        unifiedObj: unified,
        tpId,
        objType: StandardObjects.note,
    });
    const salesforceNote: any = {
        ...transformedObj,
        ...(unified.associations?.dealId && {
            parentId: unified.associations.dealId,
        }),
    };

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            salesforceNote[key] = unified.additional?.[key];
        });
    }
    return salesforceNote;
}

export async function toZohoNote(unified: UnifiedNote, tpId: TP_ID) {
    const transformedObj = await transformModelToFieldMapping({
        unifiedObj: unified,
        tpId,
        objType: StandardObjects.note,
    });
    const zoho: any = {
        data: [
            {
                ...(unified.associations?.dealId && {
                    Parent_Id: unified.associations.dealId,
                    se_module: 'Deals',
                }),
                ...transformedObj,
            },
        ],
        apply_feature_execution: [
            {
                name: 'layout_rules',
            },
        ],
        trigger: ['approval', 'workflow', 'blueprint'],
    };

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            zoho.data[0][key] = unified.additional?.[key];
        });
    }
    return zoho;
}

export async function toHubspotNote(unified: UnifiedNote, tpId: TP_ID) {
    const transformedObj = await transformModelToFieldMapping({
        unifiedObj: unified,
        tpId,
        objType: StandardObjects.note,
    });
    const hubspotNote: any = {
        properties: {
            hs_timestamp: Date.now().toString(),
            ...transformedObj,
            ...(unified.associations && {}),
        },
    };

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            if (key !== 'associations') {
                hubspotNote['properties'][key] = unified.additional?.[key];
            }
        });
    }
    // TODO: Handle associations creation elsewhere as well.
    if (unified.additional?.associations) {
        hubspotNote['associations'] = unified.additional.associations;
    }
    if (unified.associations) {
        const associationObj = unified.associations;
        const associationArr = Object.keys(associationObj).map((key) => {
            return {
                to: {
                    id: associationObj[key as NoteAssociation],
                },
                types: [getHubspotAssociationObj(key as NoteAssociation, 'note')],
            };
        });
        hubspotNote['associations'] = associationArr;
    }

    return hubspotNote;
}

export async function toPipedriveNote(unified: UnifiedNote, tpId: TP_ID) {
    const transformedObj = await transformModelToFieldMapping({
        unifiedObj: unified,
        tpId,
        objType: StandardObjects.note,
    });
    const pipedriveNote: any = {
        ...transformedObj,
        ...(unified.associations?.contactId && {
            person_id: unified.associations.contactId,
        }),
        ...(unified.associations?.companyId && {
            organization_id: unified.associations.companyId,
        }),
        ...(unified.associations?.leadId && {
            lead_id: unified.associations.leadId,
        }),
        ...(unified.associations?.dealId && {
            deal_id: unified.associations.dealId,
        }),
    };

    // Map custom fields
    if (unified.additional) {
        Object.keys(unified.additional).forEach((key) => {
            if (key !== 'associations') {
                pipedriveNote[key] = unified.additional?.[key];
            }
        });
    }

    return pipedriveNote;
}

export async function disunifyNote(note: UnifiedNote, integrationId: TP_ID) {
    if (integrationId === TP_ID.sfdc) {
        return await toSalesforceNote(note, integrationId);
    } else if (integrationId === TP_ID.hubspot) {
        return await toHubspotNote(note, integrationId);
    } else if (integrationId === TP_ID.zohocrm) {
        return await toZohoNote(note, integrationId);
    } else if (integrationId === TP_ID.pipedrive) {
        return await toPipedriveNote(note, integrationId);
    }
}
