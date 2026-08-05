import { Quasar, Notify, Dialog } from 'quasar';
import quasarIconSet from 'quasar/icon-set/material-icons';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/dist/quasar.css';
import './css/app.scss';
import { QCalendar } from '@quasar/quasar-ui-qcalendar';
import '@quasar/quasar-ui-qcalendar/index.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(Quasar, {
  plugins: { Notify, Dialog },
  iconSet: quasarIconSet,
  config: {
    dark: 'auto',
  },
});
app.component('QCalendar', QCalendar);

app.mount('#q-app');
