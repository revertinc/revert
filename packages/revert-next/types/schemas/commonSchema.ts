import { z } from '@revertdotdev/utils';

export const TP_ID = z.enum(['hubspot', 'zohocrm', 'sfdc', 'pipedrive', 'slack', 'closecrm', 'ms_dynamics_365_sales']);

