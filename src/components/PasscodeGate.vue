<template>
  <div v-if="passcode.hasCode && passcode.isUnlocked">
    <slot />
  </div>
  <q-page v-else class="planner-page flex flex-center">
    <q-card style="width: min(420px, 100%)">
      <q-card-section>
        <div class="row items-start justify-between q-gutter-sm">
          <div>
            <div class="text-h6">{{ passcode.hasCode ? 'Enter passcode' : 'Create device passcode' }}</div>
            <div class="text-body2 text-grey-7">Parent controls unlock for one minute after activity.</div>
          </div>
          <q-btn flat round icon="home" :to="{ name: 'calendar' }">
            <q-tooltip>Home</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>
      <q-card-section>
        <q-form @submit="submit">
          <q-input
            v-model="code"
            autofocus
            filled
            inputmode="numeric"
            mask="######"
            :type="show ? 'text' : 'password'"
            label="4 to 6 digit passcode"
            :error="Boolean(error)"
            :error-message="error"
          >
            <template #append>
              <q-btn flat round dense :icon="show ? 'visibility_off' : 'visibility'" @click="show = !show" />
            </template>
          </q-input>
          <q-btn class="full-width q-mt-md" color="primary" type="submit" :label="passcode.hasCode ? 'Unlock' : 'Save passcode'" />
          <q-btn
            v-if="passcode.hasCode"
            class="full-width q-mt-sm"
            flat
            color="negative"
            label="Forgot passcode?"
            @click="resetDialog = true"
          />
        </q-form>
      </q-card-section>
    </q-card>

    <q-dialog v-model="resetDialog">
      <q-card style="width: min(420px, 100%)">
        <q-card-section>
          <div class="text-h6">Reset Passcode</div>
          <div class="text-body2 text-grey-7">
            This clears only the device passcode. Children, chores, points, and calendars stay on this device.
          </div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="resetConfirmation"
            autofocus
            filled
            label="Type RESET to continue"
            :error="Boolean(resetError)"
            :error-message="resetError"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="negative" label="Reset" @click="resetPasscode" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePasscodeStore } from 'src/stores/passcode';

const passcode = usePasscodeStore();
const code = ref('');
const show = ref(false);
const error = ref('');
const resetDialog = ref(false);
const resetConfirmation = ref('');
const resetError = ref('');

async function submit() {
  error.value = '';
  try {
    if (!passcode.hasCode) {
      await passcode.setPasscode(code.value);
      code.value = '';
      return;
    }
    const ok = await passcode.unlock(code.value);
    if (!ok) error.value = 'Passcode did not match.';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to unlock.';
  }
}

async function resetPasscode() {
  resetError.value = '';
  if (resetConfirmation.value !== 'RESET') {
    resetError.value = 'Type RESET exactly.';
    return;
  }

  await passcode.resetPasscode();
  resetDialog.value = false;
  resetConfirmation.value = '';
  code.value = '';
  error.value = 'Passcode reset. Create a new passcode to continue.';
}
</script>
