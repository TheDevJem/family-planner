// Kept as Quasar SPA scaffold metadata. The runnable local build uses Vite
// with @quasar/vite-plugin so the app remains a web-only Quasar SPA.
// @ts-nocheck
import { configure } from 'quasar/wrappers';

export default configure(() => ({
  supportTS: true,
  boot: ['calendar'],
  css: ['app.scss'],
  extras: ['material-icons', 'roboto-font'],
  framework: {
    config: {
      dark: 'auto',
    },
    plugins: ['Dialog', 'Notify'],
  },
  build: {
    target: {
      browser: ['es2022', 'firefox115', 'chrome115', 'safari16'],
      node: 'node20',
    },
    vueRouterMode: 'hash',
    env: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
    },
    vitePlugins: [],
  },
  devServer: {
    open: false,
  },
}));
