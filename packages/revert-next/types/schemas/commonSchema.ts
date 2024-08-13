import { z } from '@revertdotdev/utils';

export const TP_ID = z.enum([
    'hubspot',
    'zohocrm',
    'sfdc',
    'pipedrive',
    'slack',
    'closecrm',
    'ms_dynamics_365_sales',
    'clickup',
    'discord',
    'linear',
    'jira',
    'trello',
    'bitbucket',
]);

export type tp_id = z.infer<typeof TP_ID>;
