import { createRouter, createWebHashHistory } from 'vue-router';
import MainLayout from 'src/layouts/MainLayout.vue';
import CalendarPage from 'src/pages/CalendarPage.vue';
import SettingsPage from 'src/pages/SettingsPage.vue';
import KidModePage from 'src/pages/KidModePage.vue';
import ChildProfilePage from 'src/pages/ChildProfilePage.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'calendar', component: CalendarPage },
        { path: 'kid', name: 'kid', component: KidModePage },
        { path: 'settings', name: 'settings', component: SettingsPage },
        { path: 'children/:id', name: 'child-profile', component: ChildProfilePage, props: true },
      ],
    },
  ],
});

export default router;
