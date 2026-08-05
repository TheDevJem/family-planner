<template>
  <PasscodeGate>
    <q-page class="planner-page">
      <div class="planner-toolbar q-mb-md">
        <div>
          <div class="text-h5">Settings</div>
          <div class="text-caption text-grey-7">Manage parent-only data on this device.</div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn outline icon="home" label="Home" :to="{ name: 'calendar' }" />
          <q-btn outline icon="lock" label="Lock" @click="passcode.lock" />
        </div>
      </div>

      <q-tabs v-model="tab" align="left" dense>
        <q-tab name="children" icon="child_care" label="Children" />
        <q-tab name="chores" icon="task_alt" label="Chores" />
        <q-tab name="calendar" icon="calendar_month" label="Calendars" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="children">
          <q-form class="row q-col-gutter-md q-mb-lg" @submit="saveChild">
            <div class="col-12 col-sm-3"><q-input v-model="childForm.name" label="Name" filled /></div>
            <div class="col-6 col-sm-2"><q-input v-model.number="childForm.age" type="number" label="Age" filled /></div>
            <div class="col-6 col-sm-3"><q-input v-model="childForm.birthday" type="date" label="Birthday" filled /></div>
            <div class="col-12 col-sm-3">
              <q-file v-model="avatarFile" label="Upload avatar" filled accept="image/*" @update:model-value="loadAvatar" />
            </div>
            <div class="col-12 col-sm-1 row items-end">
              <q-btn color="primary" type="submit" :icon="editingChildId ? 'save' : 'add'" />
            </div>
          </q-form>

          <q-list bordered separator>
            <q-item v-for="child in children.children" :key="child.id">
              <q-item-section avatar><q-avatar><img :src="child.avatar_url" :alt="child.name" /></q-avatar></q-item-section>
              <q-item-section>
                <q-item-label>{{ child.name }}</q-item-label>
                <q-item-label caption>{{ child.age }} years old · {{ child.points_total }} points</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn dense flat round icon="edit" @click="editChild(child)" />
                  <q-btn dense flat round color="negative" icon="delete" @click="removeChild(child.id)" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>

        <q-tab-panel name="chores">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-sm-3">
              <q-input v-model.number="chores.minimumAgeFilter" type="number" clearable label="Filter by child age" filled />
            </div>
          </div>

          <q-form class="row q-col-gutter-md q-mb-lg" @submit="saveChore">
            <div class="col-12 col-sm-3"><q-input v-model="choreForm.name" label="Name" filled /></div>
            <div class="col-6 col-sm-2"><q-input v-model.number="choreForm.minimum_age" type="number" label="Minimum age" filled /></div>
            <div class="col-6 col-sm-2"><q-input v-model.number="choreForm.points" type="number" label="Points" filled /></div>
            <div class="col-6 col-sm-2">
              <q-select v-model="choreForm.recurrence" :options="recurrenceOptions" label="Recurrence" filled />
            </div>
            <div class="col-6 col-sm-1">
              <label class="text-caption text-grey-7">Color</label>
              <input v-model="choreForm.color" class="native-color full-width" type="color" />
            </div>
            <div class="col-12 col-sm-2">
              <q-select
                v-model="choreForm.fixed_child_id"
                :options="fixedChildOptions"
                emit-value
                map-options
                clearable
                label="Fixed child"
                filled
              />
            </div>
            <div class="col-12"><q-btn color="primary" type="submit" :icon="editingChoreId ? 'save' : 'add'" label="Save chore" /></div>
          </q-form>

          <q-list bordered separator>
            <q-item v-for="chore in chores.filtered" :key="chore.id">
              <q-item-section avatar><q-avatar :style="{ background: chore.color }" text-color="white" icon="task_alt" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ chore.name }}</q-item-label>
                <q-item-label caption>
                  Age {{ chore.minimum_age }}+ · {{ chore.points }} points · {{ chore.recurrence }}
                  <span v-if="chore.fixed_child_id">· fixed to {{ childName(chore.fixed_child_id) }}</span>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn dense flat round icon="edit" @click="editChore(chore)" />
                  <q-btn dense flat round color="negative" icon="delete" @click="removeChore(chore.id)" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>

        <q-tab-panel name="calendar">
          <q-form class="row q-col-gutter-md q-mb-lg" @submit="saveSubscription">
            <div class="col-12 col-sm-3"><q-input v-model="subscriptionForm.name" label="Name" filled /></div>
            <div class="col-12 col-sm-2"><q-select v-model="subscriptionForm.type" :options="['ics', 'google']" label="Type" filled /></div>
            <div class="col-12 col-sm-4"><q-input v-model="subscriptionForm.url" label="ICS URL or Google calendar id" filled /></div>
            <div class="col-6 col-sm-1">
              <label class="text-caption text-grey-7">Color</label>
              <input v-model="subscriptionForm.color" class="native-color full-width" type="color" />
            </div>
            <div class="col-6 col-sm-1 row items-center"><q-toggle v-model="subscriptionForm.enabled" label="On" /></div>
            <div class="col-12 col-sm-1 row items-end"><q-btn color="primary" type="submit" icon="add" /></div>
          </q-form>

          <q-btn class="q-mb-md" outline icon="sync" label="Sync enabled calendars" :loading="calendar.syncing" @click="syncCalendars" />

          <q-list bordered separator>
            <q-item v-for="subscription in calendar.subscriptions" :key="subscription.id">
              <q-item-section avatar><q-avatar :style="{ background: subscription.color }" text-color="white" icon="event" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ subscription.name }}</q-item-label>
                <q-item-label caption>{{ subscription.type }} · {{ subscription.enabled ? 'enabled' : 'disabled' }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn dense flat round icon="edit" @click="editSubscription(subscription)" />
                  <q-btn dense flat round color="negative" icon="delete" @click="removeSubscription(subscription.id)" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>
      </q-tab-panels>
    </q-page>
  </PasscodeGate>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import PasscodeGate from 'src/components/PasscodeGate.vue';
import type { CalendarSubscription, Child, Chore, Recurrence } from 'src/db/models';
import { defaultAvatarUrl, fileToDataUrl, isGeneratedInitialsAvatar } from 'src/services/avatarService';
import { useCalendarStore } from 'src/stores/calendar';
import { useChildrenStore } from 'src/stores/children';
import { useChoresStore } from 'src/stores/chores';
import { usePasscodeStore } from 'src/stores/passcode';

const $q = useQuasar();
const tab = ref('children');
const passcode = usePasscodeStore();
const children = useChildrenStore();
const chores = useChoresStore();
const calendar = useCalendarStore();

const avatarFile = ref<File | null>(null);
const editingChildId = ref<number | null>(null);
const editingChoreId = ref<number | null>(null);
const editingSubscriptionId = ref<number | null>(null);

const childForm = reactive({
  name: '',
  age: 6,
  birthday: '2020-01-01',
  avatar_url: defaultAvatarUrl('Kid'),
});

const choreForm = reactive<Omit<Chore, 'id'>>({
  name: '',
  minimum_age: 5,
  points: 2,
  recurrence: 'weekly',
  color: '#1976d2',
  fixed_child_id: null,
});

const subscriptionForm = reactive<Omit<CalendarSubscription, 'id' | 'last_synced_at'>>({
  name: '',
  type: 'ics',
  url: '',
  color: '#607d8b',
  enabled: true,
});

const recurrenceOptions: Recurrence[] = ['none', 'daily', 'weekly'];
const fixedChildOptions = computed(() => children.children.map((child) => ({ label: child.name, value: child.id })));

function childName(id: number) {
  return children.byId(id)?.name ?? 'Unknown child';
}

async function loadAvatar(file: File | null) {
  if (!file) return;
  childForm.avatar_url = await fileToDataUrl(file);
}

function resolvedChildAvatar() {
  return isGeneratedInitialsAvatar(childForm.avatar_url) ? defaultAvatarUrl(childForm.name) : childForm.avatar_url;
}

function resetChildForm() {
  editingChildId.value = null;
  childForm.name = '';
  childForm.age = 6;
  childForm.birthday = '2020-01-01';
  childForm.avatar_url = defaultAvatarUrl('Kid');
  avatarFile.value = null;
}

async function saveChild() {
  if (!childForm.name) return;
  if (editingChildId.value) {
    const existing = children.byId(editingChildId.value);
    if (!existing) return;
    await children.update({ ...existing, ...childForm, avatar_url: resolvedChildAvatar() });
  } else {
    await children.create({ ...childForm, avatar_url: resolvedChildAvatar() });
  }
  resetChildForm();
}

function editChild(child: Child) {
  editingChildId.value = child.id;
  childForm.name = child.name;
  childForm.age = child.age;
  childForm.birthday = child.birthday;
  childForm.avatar_url = child.avatar_url;
}

async function removeChild(id: number) {
  await children.remove(id);
}

function resetChoreForm() {
  editingChoreId.value = null;
  Object.assign(choreForm, {
    name: '',
    minimum_age: 5,
    points: 2,
    recurrence: 'weekly',
    color: '#1976d2',
    fixed_child_id: null,
  });
}

async function saveChore() {
  if (!choreForm.name) return;
  if (editingChoreId.value) {
    await chores.update({ id: editingChoreId.value, ...choreForm });
  } else {
    await chores.create({ ...choreForm });
  }
  resetChoreForm();
}

function editChore(chore: Chore) {
  editingChoreId.value = chore.id;
  Object.assign(choreForm, { ...chore });
}

async function removeChore(id: number) {
  await chores.remove(id);
}

function resetSubscriptionForm() {
  editingSubscriptionId.value = null;
  Object.assign(subscriptionForm, {
    name: '',
    type: 'ics',
    url: '',
    color: '#607d8b',
    enabled: true,
  });
}

async function saveSubscription() {
  if (!subscriptionForm.name) return;
  if (editingSubscriptionId.value) {
    await calendar.updateSubscription({
      id: editingSubscriptionId.value,
      last_synced_at: null,
      ...subscriptionForm,
    });
  } else {
    await calendar.createSubscription({ ...subscriptionForm });
  }
  resetSubscriptionForm();
}

function editSubscription(subscription: CalendarSubscription) {
  editingSubscriptionId.value = subscription.id;
  Object.assign(subscriptionForm, subscription);
}

async function removeSubscription(id: number) {
  await calendar.removeSubscription(id);
}

async function syncCalendars() {
  try {
    await calendar.syncAll();
    $q.notify({ type: 'positive', message: 'Calendar sync finished.' });
  } catch {
    $q.notify({ type: 'negative', message: 'Calendar sync failed. Check CORS and subscription URLs.' });
  }
}

onMounted(async () => {
  await Promise.all([passcode.load(), children.load(), chores.load(), calendar.loadSubscriptions()]);
});
</script>

<style scoped>
.native-color {
  height: 56px;
  border: 1px solid rgba(127, 127, 127, 0.35);
  border-radius: 4px;
  background: transparent;
}
</style>
