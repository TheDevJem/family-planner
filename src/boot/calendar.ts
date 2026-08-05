import { boot } from 'quasar/wrappers';
import { QCalendar } from '@quasar/quasar-ui-qcalendar';
import '@quasar/quasar-ui-qcalendar/index.css';

export default boot(({ app }) => {
  app.component('QCalendar', QCalendar);
});
