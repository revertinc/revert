export enum INTEGRATIONS {
    HUBSPOT = "hubspot",
    ZOHO = "zohocrm",
    SALESFORCE = "sfdc"
}

export const DEFAULT_SCOPE = {
    [INTEGRATIONS.HUBSPOT]: [
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
    [INTEGRATIONS.ZOHO]: ['ZohoCRM.modules.ALL', 'ZohoCRM.settings.ALL', 'ZohoCRM.users.ALL', 'AaaServer.profile.READ'],
    [INTEGRATIONS.SALESFORCE]: [], // https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_tokens_scopes.htm&type=5
};
