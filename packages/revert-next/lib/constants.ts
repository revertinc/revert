import { Socials } from '@revertdotdev/icons';

export const DEFAULT_ENV = 'development';
export const appsInfo: Record<string, { name: string; logo: JSX.Element }> = {
    hubspot: {
        name: 'Hubspot',
        logo: Socials.hubspot(),
    },
    sfdc: {
        name: 'Salesforce',
        logo: Socials.sfdc(),
    },
    zohocrm: {
        name: 'ZohoCRM',
        logo: Socials.zohocrm(),
    },
    pipedrive: {
        name: 'Pipedrive',
        logo: Socials.pipedrive(),
    },
    closecrm: {
        name: 'Close CRM',
        logo: Socials.closecrm(),
    },
    ms_dynamics_365_sales: {
        name: 'MS Dynamics Sales',
        logo: Socials.ms_dynamics_365_sales(),
    },
    slack: {
        name: 'Slack',
        logo: Socials.slack(),
    },
    discord: {
        name: 'Discord',
        logo: Socials.discord(),
    },
    linear: {
        name: 'Linear',
        logo: Socials.linear(),
    },
    clickup: {
        name: 'Clickup',
        logo: Socials.clickup(),
    },
    jira: {
        name: 'Jira',
        logo: Socials.jira(),
    },
    trello: {
        name: 'Trello',
        logo: Socials.trello(),
    },

    bitbucket: {
        name: 'Bitbucket',
        logo: Socials.bitbucket(),
    },
};
