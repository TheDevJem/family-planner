<template>
  <q-layout view="hHh lpR fFf" @mousemove="passcode.recordActivity" @touchstart="passcode.recordActivity">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>Family Planner</q-toolbar-title>
        <q-toggle v-model="dark" checked-icon="dark_mode" unchecked-icon="light_mode" color="amber" dense />
        <q-btn flat round :icon="app.kidMode ? 'family_restroom' : 'child_care'" @click="toggleKidMode">
          <q-tooltip>{{ app.kidMode ? 'Parent calendar' : 'Kid mode' }}</q-tooltip>
        </q-btn>
        <q-btn flat round icon="settings" :to="{ name: 'settings' }">
          <q-tooltip>Settings</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAppStore } from 'src/stores/app';
import { usePasscodeStore } from 'src/stores/passcode';

const $q = useQuasar();
const router = useRouter();
const app = useAppStore();
const passcode = usePasscodeStore();

const dark = computed({
  get: () => $q.dark.isActive,
  set: (value: boolean) => $q.dark.set(value),
});

function toggleKidMode() {
  app.setKidMode(!app.kidMode);
  void router.push({ name: app.kidMode ? 'kid' : 'calendar' });
}

onMounted(() => {
  void passcode.load();
});
</script>
