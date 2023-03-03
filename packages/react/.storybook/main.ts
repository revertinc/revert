module.exports = {
    framework: '@storybook/react',
    stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: ['@storybook/addon-a11y', '@storybook/addon-links', '@storybook/addon-essentials'],
    core: {
        builder: 'storybook-builder-vite',
    },
    features: {
        storyStoreV7: true,
    },
    async viteFinal(config) {
        return config;
    },
};
