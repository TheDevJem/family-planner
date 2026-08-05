<template>
  <q-page class="planner-page">
    <div class="planner-toolbar q-mb-md">
      <div>
        <div class="text-h5">Weekly Calendar</div>
        <div class="text-caption text-grey-7">{{ weekRangeLabel }}</div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn dense flat round icon="chevron_left" @click="shiftWeek(-1)" />
        <q-btn dense outline label="Today" @click="goToday" />
        <q-btn dense flat round icon="chevron_right" @click="shiftWeek(1)" />
        <q-btn dense color="primary" icon="sync" label="Rotate" @click="rotate" />
        <q-btn dense outline icon="add_circle" label="Points" @click="openAdjustPoints" />
      </div>
    </div>

    <div class="calendar-shell">
      <div class="week-grid week-header">
        <div v-for="day in week" :key="day" class="day-heading">
          <div class="text-weight-medium">{{ dayName(day) }}</div>
          <div class="text-caption">{{ day }}</div>
        </div>
      </div>
      <div class="week-grid">
        <div
          v-for="day in week"
          :key="day"
          class="day-column"
          :class="{ today: day === todayKey }"
          @dragover.prevent
          @drop="dropOnDay(day)"
        >
          <q-chip
            v-for="assignment in assignments.byDate(day)"
            :key="assignment.id"
            draggable="true"
            class="chore-chip full-width q-mb-xs"
            :style="{ borderLeft: `5px solid ${assignment.chore_color}` }"
            :color="assignment.completed ? 'green-1' : 'grey-2'"
            text-color="dark"
            @dragstart="draggingId = assignment.id"
          >
            <q-avatar size="24px">
              <img :src="assignment.avatar_url" :alt="assignment.child_name" />
            </q-avatar>
            <span class="ellipsis">{{ assignment.chore_name }}</span>
            <q-space />
            <q-btn
              dense
              flat
              round
              size="sm"
              :icon="assignment.completed ? 'undo' : 'check_circle'"
              @click.stop="assignment.completed ? undo(assignment.id) : complete(assignment.id)"
            />
          </q-chip>

          <div v-for="event in eventsForDay(day)" :key="event.id" class="external-event" :style="{ borderColor: event.color }">
            <q-icon name="event" size="16px" />
            <span class="ellipsis">{{ event.title }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="q-mt-md row q-col-gutter-sm">
      <div v-for="child in children.children" :key="child.id" class="col-12 col-sm-4">
        <q-card flat bordered>
          <q-card-section class="row items-center q-gutter-sm">
            <q-avatar><img :src="child.avatar_url" :alt="child.name" /></q-avatar>
            <div>
              <router-link :to="{ name: 'child-profile', params: { id: child.id } }" class="text-weight-medium text-primary">
                {{ child.name }}
              </router-link>
              <div class="text-caption">{{ child.points_total }} points</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <PointsAdjustDialog v-model="adjustDialog" @saved="reload" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { date, useQuasar } from 'quasar';
import PointsAdjustDialog from 'src/components/PointsAdjustDialog.vue';
import { useChoreRotation } from 'src/composables/useChoreRotation';
import { addDays, endOfWeek, startOfWeek, toDateKey, weekDays } from 'src/composables/useDateTools';
import { useAssignmentsStore } from 'src/stores/assignments';
import { useCalendarStore } from 'src/stores/calendar';
import { useChildrenStore } from 'src/stores/children';
import { usePasscodeStore } from 'src/stores/passcode';

const $q = useQuasar();
const children = useChildrenStore();
const assignments = useAssignmentsStore();
const calendar = useCalendarStore();
const passcode = usePasscodeStore();
const rotation = useChoreRotation();

const anchor = ref(new Date());
const draggingId = ref<number | null>(null);
const adjustDialog = ref(false);

const week = computed(() => weekDays(anchor.value));
const todayKey = computed(() => toDateKey(new Date()));
const weekRangeLabel = computed(() => {
  const start = startOfWeek(anchor.value);
  const end = endOfWeek(anchor.value);
  return `${date.formatDate(start, 'MMM D')} - ${date.formatDate(end, 'MMM D, YYYY')}`;
});

function dayName(day: string) {
  return date.formatDate(new Date(`${day}T12:00:00`), 'ddd');
}

function eventsForDay(day: string) {
  return calendar.events.filter((event) => event.start.slice(0, 10) <= day && event.end.slice(0, 10) >= day);
}

async function reload() {
  const start = week.value[0];
  const end = week.value[6];
  await Promise.all([children.load(), assignments.loadBetween(start, end), calendar.loadEvents(start, end)]);
}

function shiftWeek(delta: number) {
  anchor.value = addDays(anchor.value, delta * 7);
  void reload();
}

function goToday() {
  anchor.value = new Date();
  void reload();
}

async function rotate() {
  await rotation.runWeeklyRotation(anchor.value);
  await reload();
  $q.notify({ type: 'positive', message: 'Weekly rotation is up to date.' });
}

async function complete(id: number) {
  await assignments.complete(id);
  await reload();
}

async function undo(id: number) {
  await assignments.undo(id);
  await reload();
}

async function dropOnDay(day: string) {
  if (!draggingId.value) return;
  await assignments.move(draggingId.value, day);
  draggingId.value = null;
  await reload();
}

function openAdjustPoints() {
  if (!passcode.isUnlocked) {
    $q.notify({ type: 'warning', message: 'Unlock settings first to adjust points.' });
    return;
  }
  adjustDialog.value = true;
}

onMounted(async () => {
  await rotation.runWeeklyRotation(new Date());
  await Promise.all([children.load(), calendar.loadSubscriptions()]);
  await reload();
});
</script>

<style scoped>
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(135px, 1fr));
  min-width: 820px;
}

.week-header {
  border-bottom: 1px solid var(--planner-border);
  background: rgba(127, 127, 127, 0.08);
}

.day-heading,
.day-column {
  padding: 10px;
  border-right: 1px solid var(--planner-border);
}

.day-column {
  min-height: 440px;
}

.day-column.today {
  background: rgba(25, 118, 210, 0.08);
}

.external-event {
  display: flex;
  gap: 6px;
  align-items: center;
  border-left: 5px solid;
  border-radius: 6px;
  padding: 6px 8px;
  background: rgba(127, 127, 127, 0.1);
  font-size: 12px;
  margin-bottom: 4px;
}

.calendar-shell {
  overflow-x: auto;
}
</style>
