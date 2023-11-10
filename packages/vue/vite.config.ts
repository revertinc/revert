import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config(); // load env vars from .env

export default defineConfig({
    /**
     * This injects the environment variables into the code.
     */
    define: {
        __CDN_PATH__: `"${process.env.CDN_PATH || 'src/lib/build/revert-dev.js'}"`,
    },
    plugins: [vue(), dts({ insertTypesEntry: true })],
    build: {
        sourcemap: true,
        lib: {
            entry: resolve(__dirname, 'src/lib/index.ts'),
            name: 'revert-vue',
            formats: ['es', 'umd'],
            fileName: (format) => `revert-vue.${format}.js`,
        },
        rollupOptions: {
            external: ['vue'],
            output: {
                globals: {
                    vue: 'Vue',
                },
            },
        },
    },
});
