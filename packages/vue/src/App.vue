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
                revertToken: 'localPublicToken',
                tenantId: "testTenantId",
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
