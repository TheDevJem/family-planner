<template>
  <q-page class="planner-page">
    <div class="planner-toolbar q-mb-md">
      <div>
        <div class="text-h5">Today</div>
        <div class="text-caption text-grey-7">Tap a chore when it is done.</div>
      </div>
      <q-btn outline icon="calendar_month" label="Parent calendar" :to="{ name: 'calendar' }" @click="app.setKidMode(false)" />
    </div>

    <div class="row q-col-gutter-md">
      <div v-for="assignment in assignments.today" :key="assignment.id" class="col-12 col-sm-6 col-md-4">
        <q-card
          bordered
          flat
          class="kid-tile cursor-pointer"
          :style="{ borderTop: `8px solid ${assignment.chore_color}` }"
          @click="toggle(assignment)"
        >
          <q-card-section class="column items-center text-center">
            <q-avatar size="72px" class="q-mb-sm">
              <img :src="assignment.avatar_url" :alt="assignment.child_name" />
            </q-avatar>
            <div class="text-h6">{{ assignment.chore_name }}</div>
            <div class="text-body2">{{ assignment.child_name }}</div>
            <q-icon
              class="q-mt-md"
              size="42px"
              :color="assignment.completed ? 'positive' : 'grey-5'"
              :name="assignment.completed ? 'check_circle' : 'radio_button_unchecked'"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-banner v-if="assignments.today.length === 0" rounded class="bg-blue-1 text-blue-10">
      No chores scheduled for today.
    </q-banner>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import type { AssignmentView } from 'src/db/models';
import { useChoreRotation } from 'src/composables/useChoreRotation';
import { startOfWeek, toDateKey } from 'src/composables/useDateTools';
import { useAppStore } from 'src/stores/app';
import { useAssignmentsStore } from 'src/stores/assignments';
import { useChildrenStore } from 'src/stores/children';

const app = useAppStore();
const assignments = useAssignmentsStore();
const children = useChildrenStore();
const rotation = useChoreRotation();

async function reload() {
  const start = toDateKey(startOfWeek(new Date()));
  const end = toDateKey(new Date(new Date(start).getTime() + 6 * 86_400_000));
  await Promise.all([assignments.loadBetween(start, end), children.load()]);
}

async function toggle(assignment: AssignmentView) {
  if (assignment.completed) {
    await assignments.undo(assignment.id);
  } else {
    await assignments.complete(assignment.id);
  }
  await reload();
}

onMounted(async () => {
  app.setKidMode(true);
  await rotation.runWeeklyRotation(new Date());
  await reload();
});
</script>
