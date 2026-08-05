import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    quasar({
      sassVariables: undefined,
    }),
  ],
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
      components: fileURLToPath(new URL('./src/components', import.meta.url)),
      pages: fileURLToPath(new URL('./src/pages', import.meta.url)),
      layouts: fileURLToPath(new URL('./src/layouts', import.meta.url)),
      stores: fileURLToPath(new URL('./src/stores', import.meta.url)),
      db: fileURLToPath(new URL('./src/db', import.meta.url)),
      repositories: fileURLToPath(new URL('./src/repositories', import.meta.url)),
      services: fileURLToPath(new URL('./src/services', import.meta.url)),
      composables: fileURLToPath(new URL('./src/composables', import.meta.url)),
    },
  },
  define: {
    'process.env.GOOGLE_CLIENT_ID': JSON.stringify(process.env.GOOGLE_CLIENT_ID ?? ''),
  },
});
