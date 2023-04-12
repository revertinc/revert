import { defineConfig } from 'vite';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config(); // load env vars from .env

export default defineConfig({
    /**
     * This injects the environment variables into the JS code.
     */
    define: {
        __CORE_API_BASE_URL__: `"${process.env.CORE_API_BASE_URL}"`,
        __HUBSPOT_CLIENT_ID__: `"${process.env.HUBSPOT_CLIENT_ID}"`,
        __REDIRECT_URL_BASE__: `"${process.env.REDIRECT_URL_BASE}"`,
        __ZOHOCRM_CLIENT_ID__: `"${process.env.ZOHOCRM_CLIENT_ID}"`,
        __SFDC_CLIENT_ID__: `"${process.env.SFDC_CLIENT_ID}"`,
    },
    build: {
        sourcemap: false,
        lib: {
            entry: resolve(__dirname, 'lib/bundle.js'),
            name: 'revert',
            formats: ['es'],
            fileName: (_format) => `revert.js`,
        },
    },
});
