<template>
  <div class="container">
    <RevertConnect :config="config" />
  </div>
</template>

<script>
import RevertConnect from './components/RevertConnect.vue';
export default {
  name: 'App',
  components: {
    RevertConnect,
  },
  data() {
    return {
      config: {
        revertToken: 'pk_test_Y2xlcmsuc3Ryb25nLmRlZXItNTYubGNsLmRldiQ',
        tenantId: 'testTenantId',
      },
    };
  },
};
</script>

<style scoped>
.container {
  margin: 2rem;
  display: flex;
  justify-content: center;
}
</style>
