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

interface ContentDetails {
    command: string;
    step1: string;
    step2: string;
}

export const sdkContent: { [key: string]: ContentDetails } = {
    react: {
        command: `npm install @revertdotdev/revert-react`,
        step1: `function App() { 
    return ( 
        <Wrapper> 
            <RevertConnect 
                config={{ 
                    revertToken: 'REVERT_PUBLIC_TOKEN', 
                    tenantId: 'CUSTOMER_TENANT_ID',
                }} 
            /> 
        </Wrapper> 
    );`,
        step2: `const { loading, error, open } = useRevertConnect({ config: props.config });
    return (
        <button
            disabled={loading || Boolean(error)}
            id="revert-connect-button"
            onClick={() => open()}
            style={{
                padding: 10,
                outline: 'none',
                background: 'rgb(39, 45, 192)',
                border: '1px solid rgb(39, 45, 192)',
                borderRadius: 5,
                cursor: 'pointer',
                color: '#fff',
                ...props.style,
            }}
        >
            {props.children || 'Connect'}
        </button>
    );
    `,
    },
    vue: {
        command: `npm install @revertdotdev/revert-vue`,
        step1: `<script>
        import { RevertConnectVue } from '@revertdotdev/revert-vue'

        export default {
          name: 'App',
          components: {
            RevertConnectVue,
          },
          data() {
            return {
              config: {
                revertToken: 'REVERT_PUBLIC_TOKEN',
                tenantId: 'CUSTOMER_TENANT_ID',
              },
            };
          },
        };
</script>

<template>
  <div class="container">
    <RevertConnect :config="config" />
  </div>
</template>
`,
        step2: `<script>
    export default {
      setup() {
        const { loading, open, error } = useRevertConnect({ config: configObject });
        return {
          loading,
          error,
          open,
        };
      }
    };
</script>

<template>
  <div class="container">
    <button :disabled="loading || Boolean(error)"
    @click="open()"
    id="revert-connect-button"
    :style="{ padding: '10px', outline: 'none', background: 'rgb(39, 45, 192)',
              border: '1px solid rgb(39, 45, 192)', borderRadius: '5px',
              cursor: 'pointer', color: '#fff' }">
      Connect your tool
    </button>
  </div>
</template>
        `,
    },
};
