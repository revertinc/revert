import { TP_ID, environments } from '@prisma/client';
import { Request, Response } from 'express';

export type CRM_TP_ID = 'zohocrm' | 'sfdc' | 'pipedrive' | 'hubspot' | 'closecrm' | 'ms_dynamics_365_sales';
export type CHAT_TP_ID = 'slack' | 'discord';
export type TICKET_TP_ID = 'linear' | 'clickup' | 'asana' | 'jira' | 'trello' | 'bitbucket';
export type ATS_TP_ID = 'greenhouse' | 'lever';

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
    [TP_ID.closecrm]: [],
    [TP_ID.discord]: ['identify', 'bot'],
    [TP_ID.linear]: ['issues:create', 'write'],
    [TP_ID.asana]: [],
    [TP_ID.clickup]: [],
    [TP_ID.trello]: ['read', 'write'],
    [TP_ID.jira]: ['read:jira-work', 'read:jira-user', 'write:jira-work', 'offline_access'],
    [TP_ID.ms_dynamics_365_sales]: ['offline_access', 'User.Read'],
    [TP_ID.bitbucket]: ['issue', 'issue:write', 'repository', 'account'],
    [TP_ID.greenhouse]: [],
    [TP_ID.lever]: [
        'applications:read:admin',
        'archive_reasons:read:admin',
        'audit_events:read:admin,contact:write:admin',
        'diversity_surveys:read:admin',
        'eeo_responses:read:admin',
        'eeo_responses_pii:read:admin',
        'feedback:write:admin',
        'feedback_templates:write:admin',
        'files:write:admin',
        'form_templates:write:admin',
        'forms:write:admin',
        'offers:read:admin',
        'opportunities:write:admin',
        'postings:write:admin',
        'stages:read:admin',
        'tasks:read:admin',
        'users:write:admin',
        'webhooks:write:admin',
        'offline_access',
        'tags:read:admin',
    ],
};

export const mapIntegrationIdToIntegrationName = {
    [TP_ID.hubspot]: 'Hubspot',
    [TP_ID.pipedrive]: 'Pipedrive',
    [TP_ID.sfdc]: 'Salesforce',
    [TP_ID.zohocrm]: 'Zoho',
    [TP_ID.slack]: 'Slack',
    [TP_ID.closecrm]: 'Close',
    [TP_ID.discord]: 'Discord',
    [TP_ID.linear]: 'Linear',
    [TP_ID.asana]: 'Asana',
    [TP_ID.clickup]: 'Clickup',
    [TP_ID.trello]: 'Trello',
    [TP_ID.jira]: 'Jira',
    [TP_ID.ms_dynamics_365_sales]: 'Microsoft Dynamics 365 Sales',
    [TP_ID.bitbucket]: 'Bitbucket',
    [TP_ID.greenhouse]: 'Greenhouse',
    [TP_ID.lever]: 'Lever',
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

export enum ChatStandardObjects {
    channel = 'channel',
    chatUser = 'chatUser',
    message = 'message',
}

export enum TicketStandardObjects {
    ticketUser = 'ticketUser',
    ticketTask = 'ticketTask',
    ticketComment = 'ticketComment',
}

export enum AtsStandardObjects {
    job = 'job',
    offer = 'offer',
    candidate = 'candidate',
    department = 'department',
}

export const objectNameMapping: Record<string, Record<CRM_TP_ID, string | undefined>> = {
    [StandardObjects.company]: {
        [TP_ID.hubspot]: 'companies',
        [TP_ID.pipedrive]: 'organization',
        [TP_ID.sfdc]: 'Account',
        [TP_ID.zohocrm]: 'Accounts',
        [TP_ID.closecrm]: 'organization',
        [TP_ID.ms_dynamics_365_sales]: 'account',
    },
    [StandardObjects.contact]: {
        [TP_ID.hubspot]: 'contacts',
        [TP_ID.pipedrive]: 'person',
        [TP_ID.sfdc]: 'Contact',
        [TP_ID.zohocrm]: 'Contacts',
        [TP_ID.closecrm]: 'contact',
        [TP_ID.ms_dynamics_365_sales]: 'contact',
    },
    [StandardObjects.deal]: {
        [TP_ID.hubspot]: 'deals',
        [TP_ID.pipedrive]: 'deal',
        [TP_ID.sfdc]: 'Opportunity',
        [TP_ID.zohocrm]: 'Deals',
        [TP_ID.closecrm]: 'opportunity',
        [TP_ID.ms_dynamics_365_sales]: 'opportunity',
    },
    [StandardObjects.event]: {
        [TP_ID.hubspot]: 'meetings',
        [TP_ID.pipedrive]: 'activity',
        [TP_ID.sfdc]: 'Event',
        [TP_ID.zohocrm]: 'Events',
        [TP_ID.closecrm]: '', // @TODO add equivalent cause there are activity, meeting and events options close crm api
        [TP_ID.ms_dynamics_365_sales]: 'appointment',
    },
    [StandardObjects.lead]: {
        [TP_ID.hubspot]: 'contacts',
        [TP_ID.pipedrive]: 'lead',
        [TP_ID.sfdc]: 'Lead',
        [TP_ID.zohocrm]: 'Leads',
        [TP_ID.closecrm]: 'lead',
        [TP_ID.ms_dynamics_365_sales]: 'lead',
    },
    [StandardObjects.note]: {
        [TP_ID.hubspot]: 'notes',
        [TP_ID.pipedrive]: 'note',
        [TP_ID.sfdc]: 'Note',
        [TP_ID.zohocrm]: 'Notes',
        [TP_ID.closecrm]: 'note',
        [TP_ID.ms_dynamics_365_sales]: 'annotation',
    },
    [StandardObjects.task]: {
        [TP_ID.hubspot]: 'tasks',
        [TP_ID.pipedrive]: 'activity',
        [TP_ID.sfdc]: 'Task',
        [TP_ID.zohocrm]: 'Tasks',
        [TP_ID.closecrm]: 'task',
        [TP_ID.ms_dynamics_365_sales]: 'task',
    },
    [StandardObjects.user]: {
        [TP_ID.hubspot]: 'users',
        [TP_ID.pipedrive]: undefined,
        [TP_ID.sfdc]: 'User',
        [TP_ID.zohocrm]: 'users',
        [TP_ID.closecrm]: 'user',
        [TP_ID.ms_dynamics_365_sales]: 'systemuser',
    },
};

// Interface for app's having parameters apart from client_id & client_secret
export interface AppConfig {
    bot_token?: string;
    org_url?: string;
}

export type IntegrationAuthProps = {
    integrationId: TP_ID;
    account:
        | (environments & {
              apps: {
                  id: string;
                  [key: string]: any;
              }[];
          })
        | null;
    clientId?: string | null;
    clientSecret?: string | null;
    code: string;
    revertPublicKey: string;
    svixAppId: string;
    environmentId?: string;
    tenantId: string;
    tenantSecretToken: string;
    response: Response;
    request: Request;
    redirectUrl?: string;
};
