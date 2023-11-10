import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import dotenv from 'dotenv';

dotenv.config(); // load env vars from .env

export default defineConfig({
    /**
     * This injects the environment variables into the code.
     */
    define: {
        __CDN_PATH__: `"${process.env.CDN_PATH || 'src/lib/build/revert-dev.js'}"`,
    },
    server: {
        port: 3001,
    },
    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
        }),
    ],
    build: {
        sourcemap: true,
        lib: {
            entry: path.resolve(__dirname, 'src/lib/index.ts'),
            name: 'revert-react',
            formats: ['es', 'umd'],
            fileName: (format) => `revert-react.${format}.js`,
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'styled-components'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'styled-components': 'styled',
                },
            },
        },
    },
});
