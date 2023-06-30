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
        __REDIRECT_URL_BASE__: `"${process.env.REDIRECT_URL_BASE}"`,
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
