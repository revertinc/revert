import { TP_ID } from '@prisma/client';

export type CRM_TP_ID = 'zohocrm' | 'sfdc' | 'pipedrive' | 'hubspot';
// export type CHAT_TP_ID = 'slack';

export const DEFAULT_SCOPE = {
    [TP_ID.hubspot]: [
        'crm.objects.contacts.read',
        'settings.users.read',
        'settings.users.write',
        'settings.users.teams.read',
        'settings.users.teams.write',
        'crm.objects.contacts.write',
        'crm.objects.marketing_events.read',
        'crm.objects.marketing_events.write',
        'crm.schemas.custom.read',
        'crm.objects.custom.read',
        'crm.objects.custom.write',
        'crm.objects.companies.write',
        'crm.schemas.contacts.read',
        'crm.objects.companies.read',
        'crm.objects.deals.read',
        'crm.objects.deals.write',
        'crm.schemas.companies.read',
        'crm.schemas.companies.write',
        'crm.schemas.contacts.write',
        'crm.schemas.deals.read',
        'crm.schemas.deals.write',
        'crm.objects.owners.read',
        'crm.objects.quotes.write',
        'crm.objects.quotes.read',
        'crm.schemas.quotes.read',
        'crm.objects.line_items.read',
        'crm.objects.line_items.write',
        'crm.schemas.line_items.read',
    ],
    [TP_ID.zohocrm]: ['ZohoCRM.modules.ALL', 'ZohoCRM.settings.ALL', 'ZohoCRM.users.ALL', 'AaaServer.profile.READ'],
    [TP_ID.sfdc]: [], // https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_tokens_scopes.htm&type=5
    [TP_ID.pipedrive]: [],
    [TP_ID.slack]: ['users:read', 'users.profile:read'],
    [TP_ID.discord]: ['users:read', 'users.profile:read'],
};

export const mapIntegrationIdToIntegrationName = {
    [TP_ID.hubspot]: 'Hubspot',
    [TP_ID.pipedrive]: 'Pipedrive',
    [TP_ID.sfdc]: 'Salesforce',
    [TP_ID.zohocrm]: 'Zoho',
    [TP_ID.slack]: 'Slack',
    [TP_ID.discord]: 'Discord',
};

export const rootSchemaMappingId = 'revertRootSchemaMapping';

export enum StandardObjects {
    company = 'company',
    contact = 'contact',
    deal = 'deal',
    event = 'event',
    lead = 'lead',
    note = 'note',
    task = 'task',
    user = 'user',
}

export const objectNameMapping: Record<string, Record<CRM_TP_ID, string | undefined>> = {
    [StandardObjects.company]: {
        [TP_ID.hubspot]: 'companies',
        [TP_ID.pipedrive]: 'organization',
        [TP_ID.sfdc]: 'Account',
        [TP_ID.zohocrm]: 'Accounts',
    },
    [StandardObjects.contact]: {
        [TP_ID.hubspot]: 'contacts',
        [TP_ID.pipedrive]: 'person',
        [TP_ID.sfdc]: 'Contact',
        [TP_ID.zohocrm]: 'Contacts',
    },
    [StandardObjects.deal]: {
        [TP_ID.hubspot]: 'deals',
        [TP_ID.pipedrive]: 'deal',
        [TP_ID.sfdc]: 'Opportunity',
        [TP_ID.zohocrm]: 'Deals',
    },
    [StandardObjects.event]: {
        [TP_ID.hubspot]: 'meetings',
        [TP_ID.pipedrive]: 'activity',
        [TP_ID.sfdc]: 'Event',
        [TP_ID.zohocrm]: 'Events',
    },
    [StandardObjects.lead]: {
        [TP_ID.hubspot]: 'contacts',
        [TP_ID.pipedrive]: 'lead',
        [TP_ID.sfdc]: 'Lead',
        [TP_ID.zohocrm]: 'Leads',
    },
    [StandardObjects.note]: {
        [TP_ID.hubspot]: 'notes',
        [TP_ID.pipedrive]: 'note',
        [TP_ID.sfdc]: 'Note',
        [TP_ID.zohocrm]: 'Notes',
    },
    [StandardObjects.task]: {
        [TP_ID.hubspot]: 'tasks',
        [TP_ID.pipedrive]: 'activity',
        [TP_ID.sfdc]: 'Task',
        [TP_ID.zohocrm]: 'Tasks',
    },
    [StandardObjects.user]: {
        [TP_ID.hubspot]: 'users',
        [TP_ID.pipedrive]: undefined,
        [TP_ID.sfdc]: 'User',
        [TP_ID.zohocrm]: 'users',
    },
};