import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
        vue(), dts({ insertTypesEntry: true })
    ],
  build: {
    sourcemap: true,
    lib: {
        entry: resolve(__dirname, 'src/lib/index.ts'),
        name: 'MyLib',
        formats: ['es', 'umd'],
        fileName: (format) => `my-lib.${format}.js`,
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
