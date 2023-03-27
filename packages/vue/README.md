<p align="center">
<img width="150" style="border-radius:75px;" src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1673932396/Revert/Revert_logo_x5ysgh.png"/>
<h1 align="center"><b>Revert</b></h1>
<p align="center">
Universal API for CRMs
<br />
</p>

# @revertdotdev/revert-vue

## Overview

Revert is the fastest way to integrate with your customer's CRMs with a single set of APIs & SDKs.

This package contains the Vue sdk with the `RevertConnectVue` component.

### Getting Started

First, install the Revert npm package:

```javascript
yarn add @revertdotdev/revert-vue
```

### Usage

1. Adding the `<RevertConnectVue>` component will instantly give your app a way for your users to connect their CRMs by opening our Modal on clicking where they will be a able to choose & connect their CRM.

```javascript
<script>
import { RevertConnectVue } from '@revertdotdev/revert-vue'

export default {
  name: 'App',
  components: {
    RevertConnectVue, 
  },
  data() {
    return {
      config: {
        revertToken: 'YOUR_TOKEN',
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
```

You can optionally also pass your own values to the `buttonStyle` and `buttonText` props:

```javascript
<script>
import { RevertConnectVue } from '@revertdotdev/revert-vue'

export default {
  name: 'App',
  components: {
    RevertConnectVue, 
  },
  data() {
    return {
      config: {
        revertToken: 'YOUR_TOKEN',
        tenantId: 'CUSTOMER_TENANT_ID',
      },
      buttonStyle: {
        padding: '10px',
        outline: 'none',
        background: 'rgb(39, 45, 192)',
        border: '1px solid rgb(39, 45, 192)',
        borderRadius: '5px',
        cursor: 'pointer',
        color: '#fff',
      }, 
      buttonText: "Connect your CRM"
    };
  },
};
</script>

<template>
  <div class="container">
    <RevertConnectVue :config="config" :button-style="buttonStyle" :button-text="buttonText"/>
  </div>
</template>
```

2. If you wish to use your own UI for it, you can use the `useRevertConnnect` hook and call the `open()` method when appropriate. For example:

```javascript
<script>
export default {
  setup() {
    const { loading, open, error } = useRevertConnect({ config: configObject });
    return {
      loading,
      error,
      open,
    };
  }<template>
  <div class="container">
    <button :disabled="loading || Boolean(error)" 
    @click="open()" 
    id="revert-connect-button"
    :style="{ padding: '10px', outline: 'none', background: 'rgb(39, 45, 192)',
              border: '1px solid rgb(39, 45, 192)', borderRadius: '5px',
              cursor: 'pointer', color: '#fff' }">
      Connect your CRM
    </button>
  </div>
</template>
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
      Connect your CRM
    </button>
  </div>
</template>
```

 You can also pass in the `integrationId` inside the `open()` method above to directly open the integration you are interested in. These are the integration IDs that are currently supported:
- `open('hubspot')`
- `open('zohocrm')`
- `open('sfdc')`

### Support

In case of questions/feedback, you can get in touch in the following ways

-   Open a Github support issue
-   Contact us over [email](mailto:jatin@revert.dev).
