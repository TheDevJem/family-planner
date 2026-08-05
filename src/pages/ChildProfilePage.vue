<template>
  <q-page class="planner-page">
    <q-btn flat icon="arrow_back" label="Calendar" :to="{ name: 'calendar' }" />

    <q-card v-if="child" flat bordered class="q-mt-md">
      <q-card-section class="row items-center q-gutter-md">
        <q-avatar size="86px"><img :src="child.avatar_url" :alt="child.name" /></q-avatar>
        <div>
          <div class="text-h5">{{ child.name }}</div>
          <div class="text-body2">{{ child.points_total }} points</div>
          <div class="text-caption">{{ birthdayLabel }}</div>
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md q-mt-sm">
      <div class="col-12 col-md-7">
        <q-card flat bordered>
          <q-card-section><div class="text-h6">Weekly Chores</div></q-card-section>
          <q-list separator>
            <q-item v-for="assignment in weeklyAssignments" :key="assignment.id">
              <q-item-section avatar>
                <q-avatar :style="{ background: assignment.chore_color }" text-color="white" icon="task_alt" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ assignment.chore_name }}</q-item-label>
                <q-item-label caption>{{ assignment.due_date }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon :name="assignment.completed ? 'check_circle' : 'radio_button_unchecked'" :color="assignment.completed ? 'positive' : 'grey'" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <div class="col-12 col-md-5">
        <q-card flat bordered>
          <q-card-section><div class="text-h6">Points History</div></q-card-section>
          <q-list separator>
            <q-item v-for="entry in child?.points_history ?? []" :key="`${entry.timestamp}-${entry.reason}`">
              <q-item-section>
                <q-item-label>{{ entry.reason }}</q-item-label>
                <q-item-label caption>{{ formatTimestamp(entry.timestamp) }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge :color="entry.delta >= 0 ? 'positive' : 'negative'">{{ entry.delta > 0 ? '+' : '' }}{{ entry.delta }}</q-badge>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { date } from 'quasar';
import { useRoute } from 'vue-router';
import { daysUntilBirthday, endOfWeek, startOfWeek, toDateKey } from 'src/composables/useDateTools';
import { useAssignmentsStore } from 'src/stores/assignments';
import { useChildrenStore } from 'src/stores/children';

const route = useRoute();
const children = useChildrenStore();
const assignments = useAssignmentsStore();
const childId = computed(() => Number(route.params.id));
const child = computed(() => children.byId(childId.value));
const weeklyAssignments = computed(() => assignments.assignments.filter((assignment) => assignment.child_id === childId.value));
const birthdayLabel = computed(() => {
  if (!child.value) return '';
  const days = daysUntilBirthday(child.value.birthday);
  return days === 0 ? 'Birthday today' : `${days} days until birthday`;
});

function formatTimestamp(timestamp: string) {
  return date.formatDate(timestamp, 'MMM D, YYYY h:mm A');
}

onMounted(async () => {
  await children.load();
  await assignments.loadBetween(toDateKey(startOfWeek(new Date())), toDateKey(endOfWeek(new Date())));
});
</script>
